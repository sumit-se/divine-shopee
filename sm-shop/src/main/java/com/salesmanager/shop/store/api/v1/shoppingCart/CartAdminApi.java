package com.salesmanager.shop.store.api.v1.shoppingCart;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.services.catalog.pricing.PricingService;
import com.salesmanager.core.business.services.catalog.product.variant.ProductVariantService;
import com.salesmanager.core.business.services.customer.CustomerService;
import com.salesmanager.core.business.services.shoppingcart.ShoppingCartService;
import com.salesmanager.core.model.catalog.product.variant.ProductVariant;
import com.salesmanager.core.model.catalog.product.description.ProductDescription;
import com.salesmanager.core.model.customer.Customer;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.reference.language.Language;
import com.salesmanager.core.model.shoppingcart.ShoppingCart;
import com.salesmanager.core.model.shoppingcart.ShoppingCartItem;
import com.salesmanager.shop.constants.Constants;
import com.salesmanager.shop.model.shoppingcart.ReadableCartDetail;
import com.salesmanager.shop.model.shoppingcart.ReadableCartDetailItem;
import com.salesmanager.shop.model.shoppingcart.ReadableCartSummary;
import com.salesmanager.shop.model.shoppingcart.ReadableCartSummaryList;
import com.salesmanager.shop.store.api.exception.ResourceNotFoundException;
import com.salesmanager.shop.store.api.exception.ServiceRuntimeException;
import com.salesmanager.shop.utils.AuthorizationUtils;
import com.salesmanager.shop.utils.DateUtil;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import springfox.documentation.annotations.ApiIgnore;

/**
 * Read-only access to shopping carts for the admin console. Unlike the
 * storefront cart endpoints, nothing here reprices, cleans up or deletes a
 * cart.
 */
@RestController
@RequestMapping("/api/v1")
@Api(tags = { "Shopping cart admin api" })
public class CartAdminApi {

	private static final String STATUS_ACTIVE = "ACTIVE";
	private static final String STATUS_ORDERED = "ORDERED";
	private static final String STATUS_ALL = "ALL";

	@Inject
	private ShoppingCartService shoppingCartService;

	@Inject
	private CustomerService customerService;

	@Inject
	private PricingService pricingService;

	@Inject
	private ProductVariantService productVariantService;

	@Inject
	private AuthorizationUtils authorizationUtils;

	@GetMapping("/private/carts")
	@ResponseStatus(HttpStatus.OK)
	@ApiOperation(httpMethod = "GET", value = "List the store's shopping carts, most recently modified first")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "string", defaultValue = "en") })
	public ReadableCartSummaryList list(
			@RequestParam(value = "status", required = false, defaultValue = STATUS_ACTIVE) String status,
			@RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
			@RequestParam(value = "count", required = false, defaultValue = "25") Integer count,
			@ApiIgnore MerchantStore merchantStore, @ApiIgnore Language language) {

		authorize(merchantStore);

		String filter = status.toUpperCase();
		if (!STATUS_ACTIVE.equals(filter) && !STATUS_ORDERED.equals(filter)) {
			filter = STATUS_ALL;
		}

		try {
			Page<ShoppingCart> carts = shoppingCartService.listByStore(merchantStore, filter, page, count);
			Map<Long, Customer> customers = new HashMap<>();

			ReadableCartSummaryList list = new ReadableCartSummaryList();
			for (ShoppingCart cart : carts.getContent()) {
				ReadableCartSummary summary = new ReadableCartSummary();
				summary(cart, summary, customers);
				list.getCarts().add(summary);
			}
			list.setRecordsTotal(carts.getTotalElements());
			list.setTotalPages(carts.getTotalPages());
			list.setNumber(list.getCarts().size());
			list.setRecordsFiltered(list.getCarts().size());
			return list;
		} catch (ServiceException e) {
			throw new ServiceRuntimeException("Error while listing shopping carts", e);
		}
	}

	@GetMapping("/private/carts/{id}")
	@ResponseStatus(HttpStatus.OK)
	@ApiOperation(httpMethod = "GET", value = "Get a shopping cart with its priced items")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "string", defaultValue = "en") })
	public ReadableCartDetail get(@PathVariable Long id, @ApiIgnore MerchantStore merchantStore,
			@ApiIgnore Language language) {

		authorize(merchantStore);

		try {
			ShoppingCart cart = shoppingCartService.getReadOnly(id, merchantStore);
			if (cart == null) {
				throw new ResourceNotFoundException("Shopping cart [" + id + "] not found");
			}

			ReadableCartDetail detail = new ReadableCartDetail();
			summary(cart, detail, new HashMap<>());

			// Batch-fetch all variants referenced by the cart items in one query.
			List<Long> variantIds = cart.getLineItems().stream()
					.map(ShoppingCartItem::getVariant).filter(v -> v != null)
					.distinct().collect(Collectors.toList());
			Map<Long, String> variantSkuById = variantIds.isEmpty() ? new HashMap<>()
					: productVariantService.getByIds(variantIds, merchantStore).stream()
							.collect(Collectors.toMap(ProductVariant::getId, v -> v.getSku() != null ? v.getSku() : ""));

			BigDecimal total = BigDecimal.ZERO;
			for (ShoppingCartItem item : cart.getLineItems()) {
				ReadableCartDetailItem line = new ReadableCartDetailItem();
				line.setProductId(item.getProductId());
				line.setSku(item.getSku());
				line.setVariant(item.getVariant());
				if (item.getVariant() != null) {
					line.setVariantSku(variantSkuById.get(item.getVariant()));
				}
				line.setQuantity(item.getQuantity());
				line.setAvailable(!item.isObsolete());
				if (!item.isObsolete()) {
					line.setName(productName(item, language));
					line.setDisplayPrice(pricingService.getDisplayAmount(item.getItemPrice(), merchantStore));
					line.setDisplaySubTotal(pricingService.getDisplayAmount(item.getSubTotal(), merchantStore));
					total = total.add(item.getSubTotal());
				}
				detail.getItems().add(line);
			}
			detail.getItems().sort((a, b) -> StringUtils.compare(a.getName(), b.getName()));
			detail.setDisplayTotal(pricingService.getDisplayAmount(total, merchantStore));
			return detail;
		} catch (ServiceException e) {
			throw new ServiceRuntimeException("Error while getting shopping cart [" + id + "]", e);
		}
	}

	@DeleteMapping("/private/carts/{id}")
	@ResponseStatus(HttpStatus.OK)
	@ApiOperation(httpMethod = "DELETE", value = "Permanently delete a shopping cart")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "string", defaultValue = "en") })
	public void delete(@PathVariable Long id, @ApiIgnore MerchantStore merchantStore,
			@ApiIgnore Language language) {

		authorize(merchantStore);

		try {
			if (!shoppingCartService.deleteCart(id, merchantStore)) {
				throw new ResourceNotFoundException("Shopping cart [" + id + "] not found");
			}
		} catch (ServiceException e) {
			throw new ServiceRuntimeException("Error while deleting shopping cart [" + id + "]", e);
		}
	}

	private void authorize(MerchantStore merchantStore) {
		String user = authorizationUtils.authenticatedUser();
		authorizationUtils.authorizeUser(user, Stream.of(Constants.GROUP_SUPERADMIN, Constants.GROUP_ADMIN,
				Constants.GROUP_ADMIN_ORDER, Constants.GROUP_ADMIN_RETAIL).collect(Collectors.toList()), merchantStore);
	}

	private void summary(ShoppingCart cart, ReadableCartSummary summary, Map<Long, Customer> customers)
			throws ServiceException {
		summary.setId(cart.getId());
		summary.setCode(cart.getShoppingCartCode());
		summary.setOrderId(cart.getOrderId());
		summary.setStatus(cart.getOrderId() == null ? STATUS_ACTIVE : STATUS_ORDERED);
		summary.setPromoCode(cart.getPromoCode());
		summary.setIpAddress(cart.getIpAddress());
		summary.setLineCount(cart.getLineItems().size());
		summary.setItemCount(cart.getLineItems().stream().mapToInt(ShoppingCartItem::getQuantity).sum());
		if (cart.getAuditSection() != null) {
			summary.setDateCreated(DateUtil.formatLongDate(cart.getAuditSection().getDateCreated()));
			summary.setDateModified(DateUtil.formatLongDate(cart.getAuditSection().getDateModified()));
		}

		Long customerId = cart.getCustomerId();
		summary.setCustomerId(customerId);
		if (customerId != null) {
			if (!customers.containsKey(customerId)) {
				customers.put(customerId, customerService.getById(customerId));
			}
			Customer customer = customers.get(customerId);
			if (customer != null) {
				summary.setCustomerEmail(customer.getEmailAddress());
				if (customer.getBilling() != null) {
					summary.setCustomerName(StringUtils.trimToNull(StringUtils.defaultString(customer.getBilling().getFirstName())
							+ " " + StringUtils.defaultString(customer.getBilling().getLastName())));
				}
			}
		}
	}

	private String productName(ShoppingCartItem item, Language language) {
		if (item.getProduct().getDescriptions() != null) {
			for (ProductDescription description : item.getProduct().getDescriptions()) {
				if (description.getLanguage() != null && language != null
						&& description.getLanguage().getId().equals(language.getId())) {
					return description.getName();
				}
			}
		}
		ProductDescription description = item.getProduct().getProductDescription();
		return description != null ? description.getName() : item.getSku();
	}

}
