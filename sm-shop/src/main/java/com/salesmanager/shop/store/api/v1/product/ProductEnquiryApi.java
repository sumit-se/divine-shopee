package com.salesmanager.shop.store.api.v1.product;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.salesmanager.core.business.services.catalog.product.ProductService;
import com.salesmanager.core.business.services.catalog.product.enquiry.ProductEnquiryService;
import com.salesmanager.core.model.catalog.product.Product;
import com.salesmanager.core.model.catalog.product.ProductEnquiry;
import com.salesmanager.core.model.catalog.product.description.ProductDescription;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.reference.language.Language;
import com.salesmanager.shop.store.api.exception.ResourceNotFoundException;
import com.salesmanager.shop.store.api.exception.ServiceRuntimeException;
import com.salesmanager.shop.utils.EmailTemplatesUtils;
import com.salesmanager.shop.utils.LocaleUtils;
import com.salesmanager.shop.utils.DateUtil;

import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import springfox.documentation.annotations.ApiIgnore;

/**
 * Enquiries about products the store does not sell directly.
 *
 * The enquiry is saved first and the store owner notified afterwards: mail can
 * fail, and a customer waiting for an answer should not disappear with it.
 */
@RestController
@RequestMapping("/api/v1")
public class ProductEnquiryApi {

	private static final Logger LOGGER = LoggerFactory.getLogger(ProductEnquiryApi.class);

	@Inject
	private ProductService productService;

	@Inject
	private ProductEnquiryService productEnquiryService;

	@Inject
	private EmailTemplatesUtils emailTemplatesUtils;

	@ResponseStatus(HttpStatus.CREATED)
	@PostMapping("/product/{sku}/enquiry")
	@ApiOperation(httpMethod = "POST", value = "Send an enquiry about a product", produces = "application/json")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "String", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "String", defaultValue = "en") })
	public Map<String, Object> enquire(@PathVariable String sku, @RequestBody Map<String, String> enquiry,
			@ApiIgnore MerchantStore merchantStore, @ApiIgnore Language language) {

		String name = StringUtils.trimToNull(enquiry.get("name"));
		String email = StringUtils.trimToNull(enquiry.get("email"));
		String phone = StringUtils.trimToNull(enquiry.get("phone"));
		String message = StringUtils.trimToNull(enquiry.get("message"));

		if (name == null || email == null) {
			throw new ServiceRuntimeException("A name and an email address are required");
		}

		Product product;
		try {
			product = productService.getBySku(sku, merchantStore, language);
		} catch (Exception e) {
			throw new ServiceRuntimeException("Product [" + sku + "] could not be read");
		}
		if (product == null) {
			throw new ResourceNotFoundException(
					"Product [" + sku + "] not found for merchant [" + merchantStore.getCode() + "]");
		}

		ProductEnquiry saved = new ProductEnquiry();
		saved.setMerchantStore(merchantStore);
		saved.setProduct(product);
		saved.setProductSku(product.getSku());
		saved.setProductName(productName(product, language));
		saved.setCustomerName(name);
		saved.setCustomerEmail(email);
		saved.setCustomerPhone(phone);
		saved.setMessage(message);

		try {
			productEnquiryService.save(saved);
		} catch (Exception e) {
			LOGGER.error("Could not save the product enquiry", e);
			throw new ServiceRuntimeException("Your enquiry could not be recorded, please try again");
		}

		// best effort: the enquiry is already safe in the database
		try {
			StringBuilder body = new StringBuilder();
			body.append("Enquiry about ").append(saved.getProductName()).append(" (").append(saved.getProductSku())
					.append(")\n\n").append("From: ").append(name).append(" <").append(email).append(">\n");
			if (phone != null) {
				body.append("Phone: ").append(phone).append("\n");
			}
			body.append("\n").append(message == null ? "" : message);
			emailTemplatesUtils.sendContactEmail(contactForm(name, email, saved, body.toString()), merchantStore,
					LocaleUtils.getLocale(language), "");
		} catch (Exception e) {
			LOGGER.error("Product enquiry saved but the notification could not be sent", e);
		}

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("id", saved.getId());
		response.put("received", true);
		return response;
	}

	private com.salesmanager.shop.model.shop.ContactForm contactForm(String name, String email, ProductEnquiry saved,
			String body) {
		com.salesmanager.shop.model.shop.ContactForm form = new com.salesmanager.shop.model.shop.ContactForm();
		form.setName(name);
		form.setEmail(email);
		form.setSubject("Product enquiry - " + saved.getProductSku());
		form.setComment(body);
		return form;
	}

	/**
	 * The enquiries a store has received, newest first. Read by the admin's
	 * Enquiries screen; the shape mirrors the other admin listings so the same
	 * table component can render it.
	 */
	@GetMapping("/private/enquiries")
	@ApiOperation(httpMethod = "GET", value = "List product enquiries", produces = "application/json")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "String", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "String", defaultValue = "en") })
	public Map<String, Object> list(@ApiIgnore MerchantStore merchantStore, @ApiIgnore Language language) {

		List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
		for (ProductEnquiry enquiry : productEnquiryService.listByStore(merchantStore)) {
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("id", enquiry.getId());
			row.put("productSku", enquiry.getProductSku());
			row.put("productName", enquiry.getProductName());
			row.put("customerName", enquiry.getCustomerName());
			row.put("customerEmail", enquiry.getCustomerEmail());
			row.put("customerPhone", enquiry.getCustomerPhone());
			row.put("message", enquiry.getMessage());
			row.put("status", enquiry.getStatus());
			row.put("dateCreated", enquiry.getAuditSection() == null ? null
					: DateUtil.formatDate(enquiry.getAuditSection().getDateCreated()));
			rows.add(row);
		}

		Map<String, Object> response = new LinkedHashMap<>();
		response.put("enquiries", rows);
		response.put("recordsTotal", rows.size());
		response.put("number", rows.size());
		return response;
	}

	/** Mark an enquiry as dealt with, or put it back on the pile. */
	@PatchMapping("/private/enquiry/{id}/status")
	@ApiOperation(httpMethod = "PATCH", value = "Change an enquiry's status", produces = "application/json")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "String", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "String", defaultValue = "en") })
	public void status(@PathVariable Long id, @RequestParam("status") String status,
			@ApiIgnore MerchantStore merchantStore, @ApiIgnore Language language) {

		ProductEnquiry enquiry = productEnquiryService.getById(id);
		if (enquiry == null || enquiry.getMerchantStore() == null
				|| enquiry.getMerchantStore().getId().intValue() != merchantStore.getId().intValue()) {
			throw new ResourceNotFoundException("Enquiry [" + id + "] not found for merchant ["
					+ merchantStore.getCode() + "]");
		}
		enquiry.setStatus(StringUtils.isBlank(status) ? "NEW" : status.toUpperCase());
		try {
			productEnquiryService.update(enquiry);
		} catch (Exception e) {
			throw new ServiceRuntimeException("Enquiry [" + id + "] could not be updated");
		}
	}

	private String productName(Product product, Language language) {
		for (ProductDescription description : product.getDescriptions()) {
			if (description.getLanguage() != null && language != null
					&& description.getLanguage().getId().equals(language.getId())) {
				return description.getName();
			}
		}
		return product.getSku();
	}
}
