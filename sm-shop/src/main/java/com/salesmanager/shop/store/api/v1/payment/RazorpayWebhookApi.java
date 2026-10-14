package com.salesmanager.shop.store.api.v1.payment;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.razorpay.Utils;
import com.salesmanager.core.business.modules.integration.payment.impl.RazorpayPayment;
import com.salesmanager.core.business.services.payments.PaymentService;
import com.salesmanager.core.business.services.payments.TransactionService;
import com.salesmanager.core.business.utils.CoreConfiguration;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.payments.Transaction;
import com.salesmanager.core.model.system.IntegrationConfiguration;
import com.salesmanager.shop.utils.EmailTemplatesUtils;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import springfox.documentation.annotations.ApiIgnore;

/**
 * Razorpay webhooks.
 *
 * Razorpay tells us about a payment twice: once through the shopper's browser,
 * which is what creates the order, and once here, server to server. The second
 * one matters because the first can be lost -- a shopper who pays and then
 * closes the window leaves money at the gateway with no order on this side, and
 * nothing would ever say so.
 *
 * What this does NOT do is create the missing order. It cannot: the customer,
 * the addresses and the chosen shipping quote only ever arrive in the checkout
 * request body, and an INIT transaction records none of them (see
 * RazorpayPayment.initTransaction). So a captured payment with no order is
 * reported to the store owner to settle by hand, rather than half-guessed into
 * an order with no delivery address.
 *
 * Register the webhook in the Razorpay dashboard with the store on the URL,
 * since Razorpay knows nothing about Shopizer stores:
 *
 *   https://host/api/v1/payment/razorpay/webhook?store=divineStore
 *
 * The endpoint is intentionally unauthenticated -- Razorpay cannot log in --
 * and is safe because nothing is acted on until the HMAC in the
 * X-Razorpay-Signature header verifies against the store's webhook secret.
 * Spring Security only guards /private/** and /auth/**, so no rule is needed.
 */
@RestController
@RequestMapping(value = "/api/v1")
@Api(tags = { "Razorpay webhook" })
public class RazorpayWebhookApi {

	private static final Logger LOGGER = LoggerFactory.getLogger(RazorpayWebhookApi.class);

	private static final String SIGNATURE_HEADER = "X-Razorpay-Signature";
	private static final String EVENT_ID_HEADER = "X-Razorpay-Event-Id";

	private static final String EVENT_PAYMENT_CAPTURED = "payment.captured";
	private static final String EVENT_PAYMENT_FAILED = "payment.failed";
	private static final String EVENT_REFUND_PROCESSED = "refund.processed";

	/**
	 * Event ids already handled, so a retry is not acted on twice.
	 *
	 * Razorpay retries until it gets a 2xx, and will happily deliver the same
	 * event several times. This is deliberately in memory and bounded: the only
	 * thing a duplicate would cause is a second warning email, and a restart
	 * losing the set is a far smaller problem than a schema for it. The real
	 * protection against double-acting is the order lookup below, which is
	 * persistent.
	 */
	private static final int REMEMBERED_EVENTS = 500;
	private final Set<String> handledEvents = Collections.newSetFromMap(
			Collections.synchronizedMap(new LinkedHashMap<String, Boolean>() {
				private static final long serialVersionUID = 1L;
				@Override
				protected boolean removeEldestEntry(Map.Entry<String, Boolean> eldest) {
					return size() > REMEMBERED_EVENTS;
				}
			}));

	@Autowired
	private PaymentService paymentService;

	@Autowired
	private TransactionService transactionService;

	@Autowired
	private EmailTemplatesUtils emailTemplatesUtils;

	@Autowired
	private CoreConfiguration coreConfiguration;

	/**
	 * Receives a Razorpay webhook.
	 *
	 * Takes the body as a String on purpose: the signature covers the exact
	 * bytes Razorpay sent, and letting Spring bind and re-serialise a DTO would
	 * change them and fail every verification.
	 *
	 * Answers 200 for anything it has dealt with, including events it ignores,
	 * so Razorpay stops retrying. A 4xx is returned only when the request
	 * cannot be trusted, and a 5xx only when the store is not configured --
	 * that one is worth retrying, because it may be fixed in the admin shortly.
	 */
	@PostMapping(value = "/payment/razorpay/webhook")
	@ApiOperation(httpMethod = "POST", value = "Razorpay webhook receiver", notes = "Verified by HMAC signature; not for manual use")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "String", defaultValue = "DEFAULT") })
	public ResponseEntity<String> receive(
			@RequestBody String payload,
			HttpServletRequest request,
			@ApiIgnore MerchantStore merchantStore) {

		String signature = request.getHeader(SIGNATURE_HEADER);
		String eventId = request.getHeader(EVENT_ID_HEADER);

		if (StringUtils.isBlank(signature)) {
			LOGGER.warn("Razorpay webhook received with no signature header; ignoring");
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("missing signature");
		}

		String webhookSecret;
		try {
			IntegrationConfiguration configuration =
					paymentService.getPaymentConfiguration("razorpay", merchantStore);
			webhookSecret = RazorpayPayment.key(configuration, RazorpayPayment.WEBHOOK_SECRET);
		} catch (Exception e) {
			LOGGER.error("Razorpay webhook: could not read the payment configuration for store "
					+ merchantStore.getCode(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("configuration unavailable");
		}

		if (StringUtils.isBlank(webhookSecret)) {
			/*
			 * Without the secret nothing can be verified, so nothing is acted
			 * on. Logged loudly because it means the webhook was registered
			 * with Razorpay but the secret was never entered in the admin, and
			 * every event is being dropped.
			 */
			LOGGER.error("Razorpay webhook: no webhook_secret configured for store {}; event dropped",
					merchantStore.getCode());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("webhook secret not configured");
		}

		try {
			if (!Utils.verifyWebhookSignature(payload, signature, webhookSecret)) {
				LOGGER.warn("Razorpay webhook signature did not verify for store {}", merchantStore.getCode());
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("invalid signature");
			}
		} catch (Exception e) {
			LOGGER.warn("Razorpay webhook signature could not be checked for store "
					+ merchantStore.getCode(), e);
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("invalid signature");
		}

		// Verified past this point, so the payload can be trusted as Razorpay's.
		if (StringUtils.isNotBlank(eventId) && !handledEvents.add(eventId)) {
			LOGGER.debug("Razorpay webhook event {} already handled; acknowledging", eventId);
			return ResponseEntity.ok("duplicate");
		}

		try {
			JSONObject body = new JSONObject(payload);
			String event = body.optString("event");

			if (EVENT_PAYMENT_CAPTURED.equals(event)) {
				handlePaymentCaptured(body, merchantStore);
			} else if (EVENT_PAYMENT_FAILED.equals(event)) {
				logPaymentEntity(body, "failed");
			} else if (EVENT_REFUND_PROCESSED.equals(event)) {
				LOGGER.info("Razorpay refund processed: {}", entityId(body, "refund"));
			} else {
				// Razorpay sends whatever the dashboard subscribes to. Anything
				// unrecognised is acknowledged rather than retried forever.
				LOGGER.debug("Razorpay webhook event {} not handled", event);
			}

		} catch (Exception e) {
			/*
			 * A verified payload that cannot be read is a bug on our side, not
			 * something a retry fixes, so it is still acknowledged. The log
			 * carries the event id, and the payment itself is in the Razorpay
			 * dashboard either way.
			 */
			LOGGER.error("Razorpay webhook could not be processed (event id " + eventId + ")", e);
		}

		return ResponseEntity.ok("ok");
	}

	/**
	 * A payment Razorpay has captured. Either the browser already turned it
	 * into an order, in which case there is nothing to do, or it did not and
	 * somebody has to be told.
	 */
	private void handlePaymentCaptured(JSONObject body, MerchantStore merchantStore) throws Exception {

		JSONObject entity = paymentEntity(body);
		if (entity == null) {
			LOGGER.warn("Razorpay payment.captured carried no payment entity");
			return;
		}

		String paymentId = entity.optString("id", null);
		String razorpayOrderId = entity.optString("order_id", null);
		long amountInPaise = entity.optLong("amount", 0L);

		if (StringUtils.isBlank(paymentId)) {
			LOGGER.warn("Razorpay payment.captured carried no payment id");
			return;
		}

		/*
		 * authorizeAndCapture writes the payment id into the transaction's
		 * details, so a transaction found by it with an order attached means
		 * the normal path already completed. This is the persistent half of the
		 * idempotency: it holds even across a restart, and it also covers the
		 * webhook arriving before the browser's callback, since in that case
		 * the alert goes out and the order still gets created moments later.
		 */
		List<Transaction> existing = transactionService.findByDetails(paymentId);
		for (Transaction transaction : existing) {
			if (transaction.getOrder() != null) {
				LOGGER.info("Razorpay payment {} already belongs to order {}; nothing to reconcile",
						paymentId, transaction.getOrder().getId());
				return;
			}
		}

		/*
		 * No order. Find the INIT transaction by the Razorpay order id purely
		 * to confirm this payment came from this store's checkout rather than
		 * being an event for somewhere else, and to log its id for whoever
		 * follows this up.
		 */
		Long initTransactionId = null;
		if (StringUtils.isNotBlank(razorpayOrderId)) {
			for (Transaction transaction : transactionService.findByDetails(razorpayOrderId)) {
				initTransactionId = transaction.getId();
				break;
			}
		}

		String amountText = formatPaise(amountInPaise, merchantStore);

		LOGGER.error(
				"Razorpay payment {} captured for {} with no order on this store. "
				+ "Razorpay order {}, init transaction {}. Refund it or place the order by hand.",
				paymentId, amountText, razorpayOrderId, initTransactionId);

		emailTemplatesUtils.sendOrphanedPaymentEmail(merchantStore, paymentId, razorpayOrderId,
				amountText, coreConfiguration.getProperty("CONTEXT_PATH"));
	}

	private void logPaymentEntity(JSONObject body, String what) {
		JSONObject entity = paymentEntity(body);
		String id = entity == null ? null : entity.optString("id", null);
		String reason = entity == null ? null : entity.optString("error_description", null);
		LOGGER.info("Razorpay payment {} {}{}", id, what,
				StringUtils.isBlank(reason) ? "" : (": " + reason));
	}

	/** payload.payment.entity, or null when the payload is not shaped that way. */
	private JSONObject paymentEntity(JSONObject body) {
		JSONObject payload = body.optJSONObject("payload");
		if (payload == null) {
			return null;
		}
		JSONObject payment = payload.optJSONObject("payment");
		return payment == null ? null : payment.optJSONObject("entity");
	}

	private String entityId(JSONObject body, String name) {
		JSONObject payload = body.optJSONObject("payload");
		if (payload == null) {
			return null;
		}
		JSONObject wrapper = payload.optJSONObject(name);
		if (wrapper == null) {
			return null;
		}
		JSONObject entity = wrapper.optJSONObject("entity");
		return entity == null ? null : entity.optString("id", null);
	}

	/** Razorpay reports amounts in paise; show them the way the store does. */
	private String formatPaise(long amountInPaise, MerchantStore merchantStore) {
		String currency = merchantStore.getCurrency() == null
				? "INR" : merchantStore.getCurrency().getCode();
		return String.format("%s %.2f", currency, amountInPaise / 100.0d);
	}

}
