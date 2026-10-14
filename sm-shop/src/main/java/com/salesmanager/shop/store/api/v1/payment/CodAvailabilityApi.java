package com.salesmanager.shop.store.api.v1.payment;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.inject.Inject;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.salesmanager.core.business.modules.integration.payment.impl.CODPayment;
import com.salesmanager.core.business.services.shipping.CodRestrictedPostalCodeService;
import com.salesmanager.core.business.services.shoppingcart.ShoppingCartService;
import com.salesmanager.core.business.utils.CodConvenienceFee;
import com.salesmanager.core.business.utils.SpecialProducts;
import com.salesmanager.core.model.shoppingcart.ShoppingCart;
import com.salesmanager.core.business.services.shipping.DeliveryRestrictedPostalCodeService;
import com.salesmanager.core.model.merchant.MerchantStore;

import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import springfox.documentation.annotations.ApiIgnore;

/**
 * Whether the store will take cash on delivery for a given order.
 *
 * The storefront asks before it offers the option, so a shopper is not left
 * choosing a method the order would then be refused for. Both rules live here:
 * the amount the store stops at, and the postal codes it will not send cash on
 * delivery to. The payment module applies the same two on the way through, so
 * this endpoint is a courtesy, not the guard.
 */
@RestController
@RequestMapping("/api/v1")
public class CodAvailabilityApi {

	@Inject
	private CodRestrictedPostalCodeService codRestrictedPostalCodeService;

	@Inject
	private DeliveryRestrictedPostalCodeService deliveryRestrictedPostalCodeService;

	@Inject
	private ShoppingCartService shoppingCartService;

	@GetMapping("/cod/availability")
	@ApiOperation(httpMethod = "GET", value = "Is cash on delivery available for this order", produces = "application/json")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "String", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "String", defaultValue = "en") })
	public Map<String, Object> availability(
			@RequestParam(value = "postalCode", required = false) String postalCode,
			@RequestParam(value = "amount", required = false) BigDecimal amount,
			@RequestParam(value = "cart", required = false) String cartCode,
			@ApiIgnore MerchantStore merchantStore) throws Exception {

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("maximumAmount", CODPayment.DEFAULT_MAXIMUM_AMOUNT);
		/*
		 * The fee and the rule behind it, so the storefront can show what paying
		 * at the door will cost before the shopper commits to it. The number is
		 * computed here rather than in the browser: the same rule decides the
		 * total the order is actually charged, and two implementations of it
		 * would eventually disagree about money.
		 *
		 * 'amount' is the order value before the fee, which is what the
		 * storefront has at this point -- the quoted total.
		 */
		response.put("feeMinimum", CodConvenienceFee.DEFAULT_MINIMUM);
		response.put("feePercent", CodConvenienceFee.DEFAULT_PERCENT);
		response.put("fee", amount != null ? CodConvenienceFee.calculate(amount) : null);

		if (amount != null && CODPayment.DEFAULT_MAXIMUM_AMOUNT.compareTo(BigDecimal.ZERO) > 0
				&& amount.compareTo(CODPayment.DEFAULT_MAXIMUM_AMOUNT) >= 0) {
			response.put("available", false);
			response.put("reason", "AMOUNT");
			return response;
		}

		// special offers are paid for up front
		if (cartCode != null && !cartCode.trim().isEmpty()) {
			ShoppingCart cart = shoppingCartService.getByCode(cartCode.trim(), merchantStore);
			if (cart != null && SpecialProducts.containsSpecial(cart.getLineItems())) {
				response.put("available", false);
				response.put("reason", "SPECIAL");
				return response;
			}
		}

		// nowhere to deliver to means nothing to pay at the door either
		if (deliveryRestrictedPostalCodeService.isRestricted(merchantStore, postalCode)) {
			response.put("available", false);
			response.put("reason", "NO_DELIVERY");
			return response;
		}

		if (codRestrictedPostalCodeService.isRestricted(merchantStore, postalCode)) {
			response.put("available", false);
			response.put("reason", "POSTAL_CODE");
			return response;
		}

		response.put("available", true);
		response.put("reason", null);
		return response;
	}

	/**
	 * Whether the store delivers to a postal code at all. The storefront asks
	 * while the shopper is still typing their address, so they are told before
	 * they have filled in a whole checkout; the order itself is refused by the
	 * checkout endpoint whatever this says.
	 */
	@GetMapping("/delivery/availability")
	@ApiOperation(httpMethod = "GET", value = "Does the store deliver to this postal code", produces = "application/json")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "String", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "String", defaultValue = "en") })
	public Map<String, Object> deliveryAvailability(
			@RequestParam(value = "postalCode", required = false) String postalCode,
			@ApiIgnore MerchantStore merchantStore) {

		Map<String, Object> response = new LinkedHashMap<>();
		boolean restricted = deliveryRestrictedPostalCodeService.isRestricted(merchantStore, postalCode);
		response.put("available", !restricted);
		response.put("reason", restricted ? "NO_DELIVERY" : null);
		return response;
	}
}
