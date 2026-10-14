package com.salesmanager.core.business.modules.integration.payment.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Refund;
import com.razorpay.Utils;
import com.salesmanager.core.model.customer.Customer;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.order.Order;
import com.salesmanager.core.model.payments.Payment;
import com.salesmanager.core.model.payments.PaymentType;
import com.salesmanager.core.model.payments.Transaction;
import com.salesmanager.core.model.payments.TransactionType;
import com.salesmanager.core.model.shoppingcart.ShoppingCartItem;
import com.salesmanager.core.model.system.IntegrationConfiguration;
import com.salesmanager.core.model.system.IntegrationModule;
import com.salesmanager.core.modules.integration.IntegrationException;
import com.salesmanager.core.modules.integration.payment.model.PaymentModule;

/**
 * Razorpay, the store's Indian payment gateway: UPI, cards, netbanking and
 * wallets.
 *
 * Razorpay is a redirect-and-confirm gateway, not a synchronous charge, so the
 * PaymentModule contract maps onto it in two halves:
 *
 *   initTransaction      creates a Razorpay order and hands its id back, which
 *                        the storefront passes to Razorpay Checkout.
 *   authorizeAndCapture  runs after the shopper pays. It verifies the signature
 *                        Razorpay returned and confirms with Razorpay itself
 *                        that the payment is captured, before the order is
 *                        allowed to exist.
 *
 * Nothing here trusts the browser. The three values that come back through the
 * client (payment id, order id, signature) are only accepted once the signature
 * checks out against the key secret AND Razorpay's own API agrees the payment is
 * captured for the expected amount. Without both, a crafted success callback
 * would be enough to place an unpaid order.
 *
 * Credentials live in MERCHANT_CONFIGURATION, AES-encrypted, written from the
 * administration tool; see the class comment on configuration keys below.
 */
public class RazorpayPayment implements PaymentModule {

	private static final Logger LOGGER = LoggerFactory.getLogger(RazorpayPayment.class);

	/**
	 * Razorpay key id, e.g. rzp_test_AbCdEf123456. Public by design -- the
	 * browser needs it to open Razorpay Checkout -- so this is the one value
	 * that is also safe to repeat in the storefront's env-config.js.
	 */
	public static final String KEY_ID = "key_id";

	/**
	 * Razorpay key secret. Signs server-to-server calls and verifies the
	 * payment signature. Shown once by the Razorpay dashboard and never again.
	 */
	public static final String KEY_SECRET = "key_secret";

	/**
	 * Webhook signing secret. A separate value from KEY_SECRET, chosen by us
	 * rather than issued by Razorpay, used to verify the X-Razorpay-Signature
	 * header on incoming webhooks. Optional until the webhook is registered.
	 */
	public static final String WEBHOOK_SECRET = "webhook_secret";

	/**
	 * Which mode a key pair belongs to is carried by the key id itself, so the
	 * module reads it off the prefix instead of asking the administrator to
	 * declare it separately and risk the two disagreeing.
	 */
	private static final String TEST_KEY_PREFIX = "rzp_test_";
	private static final String LIVE_KEY_PREFIX = "rzp_live_";

	/** Keys the storefront sends back once the shopper has paid. */
	private static final String RZP_PAYMENT_ID = "razorpay_payment_id";
	private static final String RZP_ORDER_ID = "razorpay_order_id";
	private static final String RZP_SIGNATURE = "razorpay_signature";

	/** Transaction detail keys, carried on the Shopizer Transaction. */
	public static final String DETAIL_ORDER_ID = "razorpayOrderId";
	public static final String DETAIL_PAYMENT_ID = "razorpayPaymentId";
	public static final String DETAIL_KEY_ID = "razorpayKeyId";

	@Override
	public void validateModuleConfiguration(
			IntegrationConfiguration integrationConfiguration,
			MerchantStore store) throws IntegrationException {

		List<String> errorFields = new ArrayList<String>();

		Map<String, String> keys = integrationConfiguration.getIntegrationKeys();

		String keyId = keys == null ? null : keys.get(KEY_ID);
		String keySecret = keys == null ? null : keys.get(KEY_SECRET);

		if (StringUtils.isBlank(keyId)) {
			errorFields.add(KEY_ID);
		} else if (!keyId.startsWith(TEST_KEY_PREFIX) && !keyId.startsWith(LIVE_KEY_PREFIX)) {
			// A pasted secret, a key from another gateway, or a truncated copy
			// all land here. Catching it on save beats a bare 401 at checkout.
			errorFields.add(KEY_ID);
		}

		if (StringUtils.isBlank(keySecret)) {
			errorFields.add(KEY_SECRET);
		}

		if (!errorFields.isEmpty()) {
			IntegrationException ex = new IntegrationException(IntegrationException.ERROR_VALIDATION_SAVE);
			ex.setErrorFields(errorFields);
			throw ex;
		}

		// Never log the secret, and never the key id in full: the prefix is all
		// that is needed to tell test from live in a support thread.
		LOGGER.info("Razorpay configuration saved for store {} in {} mode", store.getCode(),
				isLiveMode(integrationConfiguration) ? "LIVE" : "TEST");
	}

	/**
	 * True when the configured key pair is a live one. Read from the key id
	 * prefix, so it cannot drift out of step with the credentials in use.
	 */
	public boolean isLiveMode(IntegrationConfiguration configuration) {
		String keyId = key(configuration, KEY_ID);
		return keyId != null && keyId.startsWith(LIVE_KEY_PREFIX);
	}

	/**
	 * Reads one key out of the decrypted configuration. Callers get null for a
	 * key that was never set rather than a NullPointerException from the map.
	 */
	public static String key(IntegrationConfiguration configuration, String name) {
		if (configuration == null || configuration.getIntegrationKeys() == null) {
			return null;
		}
		return configuration.getIntegrationKeys().get(name);
	}

	/**
	 * Rupees to paise, which is what every Razorpay amount field is in.
	 *
	 * Deliberately not the string manipulation StripePayment and Stripe3Payment
	 * use: String.valueOf(amount).replace(".","") turns a BigDecimal of 1200
	 * into 1200 paise, so a 1,200 rupee order is charged 12 rupees. Scaling the
	 * BigDecimal cannot misread a value that carries no decimal point.
	 */
	private long toPaise(BigDecimal amount) throws IntegrationException {
		if (amount == null) {
			throw new IntegrationException("Razorpay: no amount to charge");
		}
		return amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
	}

	private RazorpayClient client(IntegrationConfiguration configuration) throws IntegrationException {
		String keyId = key(configuration, KEY_ID);
		String keySecret = key(configuration, KEY_SECRET);
		if (StringUtils.isBlank(keyId) || StringUtils.isBlank(keySecret)) {
			throw transactionException("Razorpay is not configured: key_id or key_secret is missing");
		}
		try {
			return new RazorpayClient(keyId, keySecret);
		} catch (RazorpayException e) {
			throw transactionException("Razorpay client could not be created: " + e.getMessage());
		}
	}

	private IntegrationException transactionException(String message) {
		IntegrationException ex = new IntegrationException(message);
		ex.setExceptionType(IntegrationException.TRANSACTION_EXCEPTION);
		ex.setErrorCode(IntegrationException.TRANSACTION_EXCEPTION);
		ex.setMessageCode("message.payment.error");
		return ex;
	}

	/**
	 * Creates the Razorpay order the storefront's checkout is opened against.
	 *
	 * payment_capture is set so a successful payment is captured by Razorpay
	 * immediately: there is no separate capture step to get wrong, and no
	 * window in which the shopper has paid but the money is only authorised.
	 */
	@Override
	public Transaction initTransaction(MerchantStore store, Customer customer,
			BigDecimal amount, Payment payment,
			IntegrationConfiguration configuration, IntegrationModule module)
			throws IntegrationException {

		RazorpayClient client = client(configuration);

		JSONObject request = new JSONObject();
		request.put("amount", toPaise(amount));
		request.put("currency", store.getCurrency() == null ? "INR" : store.getCurrency().getCode());
		request.put("payment_capture", 1);

		try {
			com.razorpay.Order rzpOrder = client.orders.create(request);
			String rzpOrderId = rzpOrder.get("id");

			Transaction transaction = new Transaction();
			transaction.setAmount(amount);
			transaction.setTransactionDate(new Date());
			transaction.setTransactionType(TransactionType.INIT);
			transaction.setPaymentType(PaymentType.CREDITCARD);
			transaction.setDetails(rzpOrderId);

			Map<String, String> details = new HashMap<String, String>();
			details.put(DETAIL_ORDER_ID, rzpOrderId);
			// The storefront needs the key id to open Checkout, and taking it
			// from here keeps it in step with the secret that made the order.
			details.put(DETAIL_KEY_ID, key(configuration, KEY_ID));
			transaction.setTransactionDetails(details);

			LOGGER.info("Razorpay order {} created for store {}", rzpOrderId, store.getCode());
			return transaction;

		} catch (RazorpayException e) {
			LOGGER.error("Razorpay order creation failed for store " + store.getCode(), e);
			throw transactionException("Razorpay order could not be created: " + e.getMessage());
		}
	}

	@Override
	public Transaction authorize(MerchantStore store, Customer customer,
			List<ShoppingCartItem> items, BigDecimal amount, Payment payment,
			IntegrationConfiguration configuration, IntegrationModule module)
			throws IntegrationException {
		// Razorpay does not offer pre-authorisation on Indian methods.
		throw transactionException("Razorpay does not support pre-authorization; use authorizeAndCapture");
	}

	/**
	 * Confirms a payment the shopper has already made, and is the only place an
	 * order becomes real.
	 *
	 * Two independent checks have to pass. The signature proves the three values
	 * were produced by Razorpay with our key secret rather than typed by
	 * someone. The fetch proves Razorpay itself considers the payment captured,
	 * for the order we created, at the amount we asked for -- a valid signature
	 * on a payment that later failed is not enough.
	 */
	@Override
	public Transaction authorizeAndCapture(MerchantStore store, Customer customer,
			List<ShoppingCartItem> items, BigDecimal amount, Payment payment,
			IntegrationConfiguration configuration, IntegrationModule module)
			throws IntegrationException {

		Map<String, String> metadata = payment.getPaymentMetaData();
		if (metadata == null) {
			throw transactionException("Razorpay: no payment details were submitted");
		}

		String paymentId = metadata.get(RZP_PAYMENT_ID);
		String orderId = metadata.get(RZP_ORDER_ID);
		String signature = metadata.get(RZP_SIGNATURE);

		if (StringUtils.isBlank(paymentId) || StringUtils.isBlank(orderId) || StringUtils.isBlank(signature)) {
			throw transactionException("Razorpay: payment id, order id and signature are all required");
		}

		String keySecret = key(configuration, KEY_SECRET);
		RazorpayClient client = client(configuration);

		try {
			JSONObject toVerify = new JSONObject();
			toVerify.put(RZP_ORDER_ID, orderId);
			toVerify.put(RZP_PAYMENT_ID, paymentId);
			toVerify.put(RZP_SIGNATURE, signature);

			if (!Utils.verifyPaymentSignature(toVerify, keySecret)) {
				// Either a forgery or a key mismatch. Both mean the payment
				// cannot be trusted, so neither gets an order.
				LOGGER.error("Razorpay signature verification failed for payment {} on store {}",
						paymentId, store.getCode());
				throw transactionException("Razorpay payment could not be verified");
			}

			com.razorpay.Payment rzpPayment = client.payments.fetch(paymentId);

			String status = rzpPayment.get("status");
			if (!"captured".equals(status)) {
				LOGGER.error("Razorpay payment {} is {} rather than captured", paymentId, status);
				throw transactionException("Razorpay payment is not captured (status: " + status + ")");
			}

			String paidOrderId = rzpPayment.get("order_id");
			if (!orderId.equals(paidOrderId)) {
				// A payment for a different order being replayed against this one.
				LOGGER.error("Razorpay payment {} belongs to order {}, not {}", paymentId, paidOrderId, orderId);
				throw transactionException("Razorpay payment does not belong to this order");
			}

			long expected = toPaise(amount);
			Number paid = rzpPayment.get("amount");
			if (paid == null || paid.longValue() != expected) {
				LOGGER.error("Razorpay payment {} is for {} paise, expected {}", paymentId, paid, expected);
				throw transactionException("Razorpay payment amount does not match the order total");
			}

			Transaction transaction = new Transaction();
			transaction.setAmount(amount);
			transaction.setTransactionDate(new Date());
			transaction.setTransactionType(TransactionType.AUTHORIZECAPTURE);
			transaction.setPaymentType(PaymentType.CREDITCARD);
			transaction.setDetails(paymentId);

			Map<String, String> details = new HashMap<String, String>();
			details.put(DETAIL_PAYMENT_ID, paymentId);
			details.put(DETAIL_ORDER_ID, orderId);
			transaction.setTransactionDetails(details);

			LOGGER.info("Razorpay payment {} captured for store {}", paymentId, store.getCode());
			return transaction;

		} catch (RazorpayException e) {
			LOGGER.error("Razorpay payment confirmation failed for payment " + paymentId, e);
			throw transactionException("Razorpay payment could not be confirmed: " + e.getMessage());
		}
	}

	/**
	 * Not reached in normal use: initTransaction sets payment_capture, so
	 * Razorpay captures on success and there is nothing left to capture. Kept
	 * honest rather than returning a Transaction that claims otherwise.
	 */
	@Override
	public Transaction capture(MerchantStore store, Customer customer,
			Order order, Transaction capturableTransaction,
			IntegrationConfiguration configuration, IntegrationModule module)
			throws IntegrationException {
		throw transactionException(
				"Razorpay payments are captured on success, so there is no separate capture step");
	}

	@Override
	public Transaction refund(boolean partial, MerchantStore store, Transaction transaction,
			Order order, BigDecimal amount,
			IntegrationConfiguration configuration, IntegrationModule module)
			throws IntegrationException {

		String paymentId = paymentIdOf(transaction);
		if (StringUtils.isBlank(paymentId)) {
			throw transactionException("Razorpay: the transaction carries no payment id to refund");
		}

		RazorpayClient client = client(configuration);

		try {
			JSONObject request = new JSONObject();
			// A partial refund names its amount; a full one leaves it out and
			// Razorpay refunds whatever is left on the payment.
			if (partial) {
				request.put("amount", toPaise(amount));
			}

			Refund refund = client.payments.refund(paymentId, request);
			String refundId = refund.get("id");

			Transaction refundTransaction = new Transaction();
			refundTransaction.setAmount(amount);
			refundTransaction.setTransactionDate(new Date());
			refundTransaction.setTransactionType(TransactionType.REFUND);
			refundTransaction.setPaymentType(PaymentType.CREDITCARD);
			refundTransaction.setDetails(refundId);

			Map<String, String> details = new HashMap<String, String>();
			details.put(DETAIL_PAYMENT_ID, paymentId);
			details.put("razorpayRefundId", refundId);
			refundTransaction.setTransactionDetails(details);

			LOGGER.info("Razorpay refund {} created for payment {} ({})", refundId, paymentId,
					partial ? "partial" : "full");
			return refundTransaction;

		} catch (RazorpayException e) {
			LOGGER.error("Razorpay refund failed for payment " + paymentId, e);
			throw transactionException("Razorpay refund failed: " + e.getMessage());
		}
	}

	/**
	 * The Razorpay payment id behind a Shopizer transaction. Prefers the
	 * structured detail and falls back to the details column, which is where
	 * authorizeAndCapture also writes it.
	 */
	private String paymentIdOf(Transaction transaction) {
		if (transaction == null) {
			return null;
		}
		if (transaction.getTransactionDetails() != null) {
			String fromDetails = transaction.getTransactionDetails().get(DETAIL_PAYMENT_ID);
			if (!StringUtils.isBlank(fromDetails)) {
				return fromDetails;
			}
		}
		return transaction.getDetails();
	}

}
