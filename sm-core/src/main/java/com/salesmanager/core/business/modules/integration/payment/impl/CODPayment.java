package com.salesmanager.core.business.modules.integration.payment.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.salesmanager.core.business.services.shipping.CodRestrictedPostalCodeService;
import com.salesmanager.core.business.utils.SpecialProducts;
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
 * Cash on delivery.
 *
 * PaymentType.COD has always existed in the model, but no module implemented it,
 * so an order placed with it had nothing to dispatch to. Money changes hands at
 * the door, so there is no gateway to call and nothing to configure: the order is
 * recorded with a transaction that says payment is due on delivery.
 *
 * Modelled on MoneyOrderPayment, the other offline method, except that it needs
 * no configuration keys.
 */
public class CODPayment implements PaymentModule {

	/**
	 * Cash on delivery stops here: a courier is not sent to collect this much at
	 * the door, so an order of this total or more has to be paid for online. The
	 * storefront hides the option above the same figure (APP_COD_MAX_AMOUNT);
	 * this is what makes it stick, whatever the order was placed with.
	 *
	 * Set it to zero or less to lift the limit.
	 */
	public static final BigDecimal DEFAULT_MAXIMUM_AMOUNT = new BigDecimal("2000");

	private BigDecimal maximumAmount = DEFAULT_MAXIMUM_AMOUNT;

	/** The postcodes this store refuses cash on delivery for. */
	private CodRestrictedPostalCodeService codRestrictedPostalCodeService;

	public void setCodRestrictedPostalCodeService(
			CodRestrictedPostalCodeService codRestrictedPostalCodeService) {
		this.codRestrictedPostalCodeService = codRestrictedPostalCodeService;
	}

	/**
	 * Both addresses are checked, not just the delivery one. A saved profile can
	 * hold a delivery address with a postcode that is not a postcode at all --
	 * an order slipped past this rule with "UttarPradesh" sitting in that field
	 * while the restricted code sat in the billing address. If either address
	 * names a restricted code, the money is not collected at the door.
	 */
	private List<String> destinationPostalCodes(Customer customer) {
		List<String> postalCodes = new ArrayList<String>();
		if (customer == null) {
			return postalCodes;
		}
		if (customer.getDelivery() != null && customer.getDelivery().getPostalCode() != null) {
			postalCodes.add(customer.getDelivery().getPostalCode());
		}
		if (customer.getBilling() != null && customer.getBilling().getPostalCode() != null) {
			postalCodes.add(customer.getBilling().getPostalCode());
		}
		return postalCodes;
	}

	private void assertDeliverable(MerchantStore store, Customer customer) throws IntegrationException {
		if (codRestrictedPostalCodeService == null) {
			return;
		}
		for (String postalCode : destinationPostalCodes(customer)) {
			if (codRestrictedPostalCodeService.isRestricted(store, postalCode)) {
				IntegrationException exception = new IntegrationException(
						"Cash on delivery is not available for postal code " + postalCode, null);
				exception.setErrorCode(IntegrationException.TRANSACTION_EXCEPTION);
				exception.setMessageCode("message.payment.codpostalcode");
				throw exception;
			}
		}
	}

	public BigDecimal getMaximumAmount() {
		return maximumAmount;
	}

	public void setMaximumAmount(BigDecimal maximumAmount) {
		this.maximumAmount = maximumAmount;
	}

	private void assertWithinLimit(BigDecimal amount) throws IntegrationException {
		if (maximumAmount == null || maximumAmount.compareTo(BigDecimal.ZERO) <= 0) {
			return;
		}
		if (amount != null && amount.compareTo(maximumAmount) >= 0) {
			/*
			 * The single-argument constructors of this exception hand their string
			 * to ServiceException(String messageCode), which files it as a code and
			 * leaves the message null -- the checkout API then reports its generic
			 * "Integration problen occured" instead of the reason. The two-argument
			 * form is the one that keeps the text.
			 */
			IntegrationException exception = new IntegrationException(
					"Cash on delivery is not available for orders of " + maximumAmount.toPlainString() + " or more",
					null);
			exception.setErrorCode(IntegrationException.TRANSACTION_EXCEPTION);
			exception.setMessageCode("message.payment.codlimit");
			throw exception;
		}
	}

	/** special offers (the Special category) are paid for up front */
	private void assertNoSpecialProducts(List<ShoppingCartItem> items) throws IntegrationException {
		if (SpecialProducts.containsSpecial(items)) {
			IntegrationException exception = new IntegrationException(
					"Cash on delivery is not available for special offer products, please pay online", null);
			exception.setErrorCode(IntegrationException.TRANSACTION_EXCEPTION);
			exception.setMessageCode("message.payment.codspecial");
			throw exception;
		}
	}

	@Override
	public void validateModuleConfiguration(IntegrationConfiguration integrationConfiguration, MerchantStore store)
			throws IntegrationException {
		// nothing to validate: cash on delivery has no credentials or address of
		// its own, unlike a money order
	}

	@Override
	public Transaction initTransaction(MerchantStore store, Customer customer, BigDecimal amount, Payment payment,
			IntegrationConfiguration configuration, IntegrationModule module) throws IntegrationException {
		// no gateway handshake
		return null;
	}

	@Override
	public Transaction authorize(MerchantStore store, Customer customer, List<ShoppingCartItem> items,
			BigDecimal amount, Payment payment, IntegrationConfiguration configuration, IntegrationModule module)
			throws IntegrationException {
		// nothing to authorize before delivery
		return null;
	}

	@Override
	public Transaction authorizeAndCapture(MerchantStore store, Customer customer, List<ShoppingCartItem> items,
			BigDecimal amount, Payment payment, IntegrationConfiguration configuration, IntegrationModule module)
			throws IntegrationException {

		assertWithinLimit(amount);
		assertDeliverable(store, customer);
		assertNoSpecialProducts(items);

		Transaction transaction = new Transaction();
		transaction.setAmount(amount);
		transaction.setTransactionDate(new Date());
		transaction.setTransactionType(TransactionType.AUTHORIZECAPTURE);
		transaction.setPaymentType(PaymentType.COD);

		return transaction;
	}

	@Override
	public Transaction refund(boolean partial, MerchantStore store, Transaction transaction, Order order,
			BigDecimal amount, IntegrationConfiguration configuration, IntegrationModule module)
			throws IntegrationException {
		// a refund on a cash sale is handled off the system
		throw new IntegrationException("Transaction not supported");
	}

	@Override
	public Transaction capture(MerchantStore store, Customer customer, Order order, Transaction capturableTransaction,
			IntegrationConfiguration configuration, IntegrationModule module) throws IntegrationException {
		// captured on delivery, outside the application
		return null;
	}

}
