package com.salesmanager.shop.store.facade.product;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.salesmanager.core.business.modules.email.Email;
import com.salesmanager.core.business.repositories.catalog.product.alert.StockAlertRepository;
import com.salesmanager.core.business.services.catalog.product.ProductService;
import com.salesmanager.core.business.services.merchant.MerchantStoreService;
import com.salesmanager.core.business.services.system.EmailService;
import com.salesmanager.core.model.catalog.product.Product;
import com.salesmanager.core.model.catalog.product.alert.StockAlert;
import com.salesmanager.core.model.catalog.product.description.ProductDescription;
import com.salesmanager.core.model.catalog.product.image.ProductImage;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.shop.store.api.exception.OperationNotAllowedException;
import com.salesmanager.shop.store.api.exception.ResourceNotFoundException;
import com.salesmanager.shop.utils.ImageFilePath;
import com.salesmanager.shop.utils.ProductStock;

/**
 * "Notify me when available": shoppers waiting for a sold-out product, and the
 * email that tells them it can be bought again.
 *
 * A product counts as available when it could be added to the cart: switched on,
 * not an enquiry-only product, and with stock -- on one of its variants when it
 * has variants (beads), else on itself. Every waiting shopper is told at the
 * same moment, once; the subscription then closes.
 *
 * The check runs on a timer rather than on each stock change, so every way stock
 * comes back is covered: an admin edit, a new bead, an import, a returned order.
 */
@Service
public class StockAlertService {

	private static final Logger LOGGER = LoggerFactory.getLogger(StockAlertService.class);

	private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
	private static final String TEMPLATE = "email_template_stock_alert.ftl";

	@Inject
	private StockAlertRepository repository;

	@Inject
	private ProductService productService;

	@Inject
	private MerchantStoreService merchantStoreService;

	@Inject
	private EmailService emailService;

	@Inject
	@Qualifier("img")
	private ImageFilePath imageUtils;

	/** where product pages live, for the link in the email */
	@Value("${config.storefront.url:http://localhost:3000}")
	private String storefrontUrl;

	/** this API, for the unsubscribe link */
	@Value("${config.backend.url:http://localhost:8080}")
	private String backendUrl;

	// ---------------------------------------------------------------- shoppers

	@Transactional
	public void subscribe(MerchantStore store, Long productId, String email, String phone, String language) {
		String address = StringUtils.trimToEmpty(email);
		if (address.length() > 100 || !EMAIL.matcher(address).matches()) {
			throw new OperationNotAllowedException("Please enter a valid email address");
		}
		String number = StringUtils.trimToNull(phone);
		if (number != null && !number.matches("^[+0-9 ()-]{7,20}$")) {
			throw new OperationNotAllowedException("Please enter a valid phone number");
		}
		Product product = product(store, productId);
		if (enquiryOnly(product)) {
			throw new OperationNotAllowedException("This product is sold by enquiry");
		}
		if (!repository.findPending(store.getId(), productId, address).isEmpty()) {
			return; // already on the list: nothing to do, and nothing to reveal
		}
		StockAlert alert = new StockAlert();
		alert.setMerchantId(store.getId());
		alert.setProductId(productId);
		alert.setEmail(address);
		alert.setPhone(number);
		alert.setLanguage(StringUtils.defaultIfBlank(language, "en"));
		alert.setToken(UUID.randomUUID().toString());
		alert.setCreatedAt(new Date());
		repository.save(alert);
	}

	/** @return false when the link was already used or never existed */
	@Transactional
	public boolean unsubscribe(String token) {
		return repository.findByToken(StringUtils.trimToEmpty(token)).map(alert -> {
			repository.delete(alert);
			return true;
		}).orElse(false);
	}

	// ---------------------------------------------------------------- admin

	@Transactional(readOnly = true)
	public Map<Long, Long> waitingCounts(MerchantStore store) {
		Map<Long, Long> counts = new LinkedHashMap<>();
		for (Object[] row : repository.countPendingByProduct(store.getId())) {
			counts.put((Long) row[0], (Long) row[1]);
		}
		return counts;
	}

	@Transactional(readOnly = true)
	public List<StockAlert> waiting(MerchantStore store, Long productId) {
		product(store, productId);
		return repository.findPending(store.getId(), productId);
	}

	@Transactional
	public void remove(MerchantStore store, Long alertId) {
		StockAlert alert = repository.findById(alertId).orElse(null);
		if (alert == null || !alert.getMerchantId().equals(store.getId())) {
			throw new ResourceNotFoundException("Stock alert [" + alertId + "] not found");
		}
		repository.delete(alert);
	}

	@Transactional(readOnly = true)
	public boolean inStock(MerchantStore store, Long productId) {
		return canBeBought(product(store, productId));
	}

	/**
	 * "Notify now" from the admin: only when the product can actually be
	 * bought, so nobody is sent to a page that still says sold out.
	 * @return how many shoppers were emailed
	 */
	@Transactional
	public int notifyNow(MerchantStore store, Long productId) {
		Product product = product(store, productId);
		if (!canBeBought(product)) {
			throw new OperationNotAllowedException("This product is still out of stock, so nobody was notified");
		}
		return send(store, product, repository.findPending(store.getId(), productId));
	}

	// ---------------------------------------------------------------- the check

	@Scheduled(initialDelayString = "${config.stockalert.initial.ms:60000}", fixedDelayString = "${config.stockalert.check.ms:900000}")
	@Transactional
	public void checkAll() {
		Map<String, List<StockAlert>> byProduct = new LinkedHashMap<>();
		for (StockAlert alert : repository.findPending()) {
			byProduct.computeIfAbsent(alert.getMerchantId() + ":" + alert.getProductId(), k -> new ArrayList<>()).add(alert);
		}
		Map<Integer, MerchantStore> stores = new HashMap<>();
		for (List<StockAlert> alerts : byProduct.values()) {
			StockAlert first = alerts.get(0);
			try {
				MerchantStore store = stores.computeIfAbsent(first.getMerchantId(), id -> {
					try {
						return merchantStoreService.getById(id);
					} catch (Exception e) {
						return null;
					}
				});
				Product product = store == null ? null : productService.getById(first.getProductId());
				if (product == null) {
					continue; // store or product gone; the rows are left for the admin
				}
				if (canBeBought(product)) {
					int sent = send(store, product, alerts);
					LOGGER.info("Stock alert: product {} is available, {} of {} waiting shoppers notified",
							product.getId(), sent, alerts.size());
				}
			} catch (Exception e) {
				LOGGER.error("Stock alert check failed for product " + first.getProductId(), e);
			}
		}
	}

	// ---------------------------------------------------------------- helpers

	private Product product(MerchantStore store, Long productId) {
		Product product = productService.getById(productId);
		if (product == null || !product.getMerchantStore().getId().equals(store.getId())) {
			throw new ResourceNotFoundException("Product [" + productId + "] not found");
		}
		return product;
	}

	private boolean enquiryOnly(Product product) {
		return product.getType() != null && Boolean.FALSE.equals(product.getType().getAllowAddToCart());
	}

	/** could a shopper add it to the cart right now */
	boolean canBeBought(Product product) {
		if (!product.isAvailable() || enquiryOnly(product)) {
			return false;
		}
		return !ProductStock.soldOut(product);
	}

	/** emails each shopper; one that fails stays pending for the next check */
	private int send(MerchantStore store, Product product, List<StockAlert> alerts) {
		int sent = 0;
		for (StockAlert alert : alerts) {
			try {
				emailService.sendHtmlEmail(store, email(store, product, alert));
				alert.setNotifiedAt(new Date());
				repository.save(alert);
				sent++;
			} catch (Exception e) {
				LOGGER.error("Stock alert email to " + alert.getEmail() + " failed", e);
			}
		}
		return sent;
	}

	private Email email(MerchantStore store, Product product, StockAlert alert) {
		ProductDescription description = description(product, alert.getLanguage());
		String name = description != null ? description.getName() : product.getSku();
		String slug = description != null && StringUtils.isNotBlank(description.getSeUrl())
				? description.getSeUrl() : String.valueOf(product.getId());

		Map<String, String> tokens = new HashMap<>();
		tokens.put("EMAIL_STORE_NAME", store.getStorename());
		tokens.put("PRODUCT_NAME", name);
		tokens.put("PRODUCT_URL", StringUtils.removeEnd(storefrontUrl, "/") + "/product/" + slug);
		tokens.put("PRODUCT_IMAGE", image(store, product));
		tokens.put("UNSUBSCRIBE_URL", StringUtils.removeEnd(backendUrl, "/") + "/api/v1/stock-alert/unsubscribe/" + alert.getToken());

		Email email = new Email();
		email.setFrom(store.getStorename());
		email.setFromEmail(store.getStoreEmailAddress());
		email.setTo(alert.getEmail());
		email.setSubject("Available again: " + name);
		email.setTemplateName(TEMPLATE);
		email.setTemplateTokens(tokens);
		return email;
	}

	private ProductDescription description(Product product, String language) {
		ProductDescription fallback = null;
		for (ProductDescription d : product.getDescriptions()) {
			if (d.getLanguage() != null && d.getLanguage().getCode().equals(language)) {
				return d;
			}
			if (fallback == null || (d.getLanguage() != null && "en".equals(d.getLanguage().getCode()))) {
				fallback = d;
			}
		}
		return fallback;
	}

	/** the product's main photo, or empty when it has none */
	private String image(MerchantStore store, Product product) {
		ProductImage main = null;
		for (ProductImage image : product.getImages()) {
			if (image.getImageType() != 0 || StringUtils.isBlank(image.getProductImage())) {
				continue; // videos and external links have no photo file
			}
			if (main == null || image.isDefaultImage()) {
				main = image;
			}
		}
		if (main == null) {
			return "";
		}
		return imageUtils.getContextPath() + imageUtils.buildProductImageUtils(store, product.getSku(), main.getProductImage());
	}

}
