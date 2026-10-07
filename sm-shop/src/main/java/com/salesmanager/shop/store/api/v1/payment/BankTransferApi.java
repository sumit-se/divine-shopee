package com.salesmanager.shop.store.api.v1.payment;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.services.payments.PaymentService;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.system.IntegrationConfiguration;
import com.salesmanager.shop.store.api.exception.ServiceRuntimeException;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import springfox.documentation.annotations.ApiIgnore;

/**
 * What the storefront shows a shopper who pays by bank transfer / UPI.
 *
 * The payment itself is the built-in "moneyorder" module; its one setting,
 * integrationKeys["address"], holds the store's bank and UPI details as entered
 * in Admin > Payment > Bank transfer / UPI. Only that text and whether the
 * method is switched on are exposed here -- nothing else of the module's
 * configuration.
 */
@RestController
@RequestMapping("/api/v1")
@Api(tags = { "Bank transfer payment details" })
public class BankTransferApi {

	private static final String MODULE = "moneyorder";

	@Autowired
	private PaymentService paymentService;

	@GetMapping("/payment/bank-transfer")
	@ApiOperation(httpMethod = "GET", value = "Whether bank transfer / UPI is offered, and the details to pay to")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT") })
	public Map<String, Object> details(@ApiIgnore MerchantStore merchantStore) {
		try {
			IntegrationConfiguration config = paymentService.getPaymentConfiguration(MODULE, merchantStore);
			Map<String, Object> result = new HashMap<>();
			boolean active = config != null && config.isActive();
			result.put("active", active);
			String details = active && config.getIntegrationKeys() != null ? config.getIntegrationKeys().get("address") : null;
			result.put("details", details == null || details.trim().isEmpty() ? null : details);
			return result;
		} catch (ServiceException e) {
			throw new ServiceRuntimeException("Error while reading bank transfer details", e);
		}
	}

}
