package com.salesmanager.shop.store.api.v1.product;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.inject.Inject;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.salesmanager.core.model.catalog.product.alert.StockAlert;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.reference.language.Language;
import com.salesmanager.shop.constants.Constants;
import com.salesmanager.shop.store.api.exception.UnauthorizedException;
import com.salesmanager.shop.store.controller.user.facade.UserFacade;
import com.salesmanager.shop.store.facade.product.StockAlertService;
import com.salesmanager.shop.utils.DateUtil;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import springfox.documentation.annotations.ApiIgnore;

/**
 * "Notify me when available" (StockAlertService): shoppers sign up for a
 * sold-out product and cancel from the email; the admin sees who is waiting and
 * can send the notice straight away once stock is back.
 */
@RestController
@RequestMapping("/api/v1")
@Api(tags = { "Stock alerts (notify me when available)" })
public class StockAlertApi {

	@Inject
	private StockAlertService stockAlertService;

	@Inject
	private UserFacade userFacade;

	// ---------------------------------------------------------------- shoppers

	@ResponseStatus(HttpStatus.CREATED)
	@PostMapping("/product/{id}/stock-alert")
	@ApiOperation(httpMethod = "POST", value = "Ask to be emailed when a sold-out product can be bought again; body {email, phone?}")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "string", defaultValue = "en") })
	public Map<String, String> subscribe(@PathVariable Long id, @RequestBody Map<String, String> body,
			@ApiIgnore MerchantStore merchantStore, @ApiIgnore Language language) {
		stockAlertService.subscribe(merchantStore, id, body.get("email"), body.get("phone"),
				language != null ? language.getCode() : "en");
		Map<String, String> result = new HashMap<>();
		result.put("message", "We will email you as soon as it is available.");
		return result;
	}

	/** the link in the email: a plain page, since it is opened from a mail client */
	@GetMapping(value = "/stock-alert/unsubscribe/{token}", produces = MediaType.TEXT_HTML_VALUE)
	public String unsubscribe(@PathVariable String token) {
		boolean removed = stockAlertService.unsubscribe(token);
		String message = removed
				? "Your alert has been cancelled. You will not receive an email about this product."
				: "This alert was already cancelled or has been sent.";
		return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width\">"
				+ "<title>Alert cancelled</title></head>"
				+ "<body style=\"font-family:Helvetica,Arial,sans-serif;background:#f6f1e7;margin:0;padding:48px 16px;\">"
				+ "<div style=\"max-width:480px;margin:0 auto;background:#fff;border-radius:10px;padding:28px;"
				+ "border:1px solid #ecdcc0;color:#333;\"><h2 style=\"color:#7f0000;margin-top:0;\">Divine Shopee</h2>"
				+ "<p style=\"font-size:15px;line-height:1.6;\">" + message + "</p></div></body></html>";
	}

	// ---------------------------------------------------------------- admin

	@GetMapping("/private/stock-alerts/summary")
	@ApiOperation(httpMethod = "GET", value = "How many shoppers are waiting, per product id")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT") })
	public Map<Long, Long> summary(@ApiIgnore MerchantStore merchantStore) {
		authorize();
		return stockAlertService.waitingCounts(merchantStore);
	}

	@GetMapping("/private/product/{id}/stock-alerts")
	@ApiOperation(httpMethod = "GET", value = "Shoppers waiting for a product, and whether it is in stock now")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT") })
	public Map<String, Object> waiting(@PathVariable Long id, @ApiIgnore MerchantStore merchantStore) {
		authorize();
		List<Map<String, Object>> rows = stockAlertService.waiting(merchantStore, id).stream().map(this::row)
				.collect(Collectors.toList());
		Map<String, Object> result = new HashMap<>();
		result.put("inStock", stockAlertService.inStock(merchantStore, id));
		result.put("waiting", rows);
		return result;
	}

	@PostMapping("/private/product/{id}/stock-alerts/notify")
	@ApiOperation(httpMethod = "POST", value = "Email everyone waiting for a product now (only when it is in stock)")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT") })
	public Map<String, Integer> notifyNow(@PathVariable Long id, @ApiIgnore MerchantStore merchantStore) {
		authorize();
		Map<String, Integer> result = new HashMap<>();
		result.put("sent", stockAlertService.notifyNow(merchantStore, id));
		return result;
	}

	@DeleteMapping("/private/stock-alert/{alertId}")
	@ApiOperation(httpMethod = "DELETE", value = "Take one shopper off a waiting list")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT") })
	public void remove(@PathVariable Long alertId, @ApiIgnore MerchantStore merchantStore) {
		authorize();
		stockAlertService.remove(merchantStore, alertId);
	}

	private Map<String, Object> row(StockAlert alert) {
		Map<String, Object> row = new HashMap<>();
		row.put("id", alert.getId());
		row.put("email", alert.getEmail());
		row.put("phone", alert.getPhone());
		row.put("since", DateUtil.formatLongDate(alert.getCreatedAt()));
		return row;
	}

	private void authorize() {
		String user = userFacade.authenticatedUser();
		if (user == null) {
			throw new UnauthorizedException();
		}
		userFacade.authorizedGroup(user, Stream.of(Constants.GROUP_SUPERADMIN, Constants.GROUP_ADMIN,
				Constants.GROUP_ADMIN_CATALOGUE, Constants.GROUP_ADMIN_RETAIL).collect(Collectors.toList()));
	}

}
