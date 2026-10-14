package com.salesmanager.shop.populator.order.transaction;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.Validate;
import org.json.JSONObject;

import com.salesmanager.core.business.exception.ConversionException;
import com.salesmanager.core.business.services.catalog.pricing.PricingService;
import com.salesmanager.core.business.utils.AbstractDataPopulator;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.payments.Payment;
import com.salesmanager.core.model.payments.PaymentType;
import com.salesmanager.core.model.payments.TransactionType;
import com.salesmanager.core.model.reference.language.Language;
import com.salesmanager.shop.model.order.transaction.PersistablePayment;

public class PersistablePaymentPopulator extends AbstractDataPopulator<PersistablePayment, Payment> {
	
	
	PricingService pricingService;



	@Override
	public Payment populate(PersistablePayment source, Payment target, MerchantStore store, Language language)
			throws ConversionException {
		
		Validate.notNull(source,"PersistablePayment cannot be null");
		Validate.notNull(pricingService,"pricingService must be set");
		if(target == null) {
			target = new Payment();
		}
		
		try {
		
			target.setAmount(pricingService.getAmount(source.getAmount()));
			target.setModuleName(source.getPaymentModule());
			target.setPaymentType(PaymentType.valueOf(source.getPaymentType()));
			target.setTransactionType(TransactionType.valueOf(source.getTransactionType()));
			
			Map<String,String> metadata = new HashMap<String,String>();
			metadata.put("paymentToken", source.getPaymentToken());
			/*
			 * paymentToken holds a single string, which suited gateways that
			 * hand back one token. Razorpay returns three values that are only
			 * meaningful together -- payment id, order id and signature -- so
			 * the storefront sends them as a JSON object in the same field and
			 * they are unpacked here into their own metadata entries.
			 *
			 * The raw value is left under "paymentToken" either way, so a
			 * single-token gateway reads exactly what it always did.
			 */
			putTokenFields(source.getPaymentToken(), metadata);
			target.setPaymentMetaData(metadata);
			
			return target;
		
		} catch(Exception e) {
			throw new ConversionException(e);
		}
	}

	/**
	 * Unpacks a JSON paymentToken into individual metadata entries. A token that
	 * is not JSON is left alone rather than treated as an error: that is the
	 * normal shape for every other gateway.
	 */
	private void putTokenFields(String paymentToken, Map<String,String> metadata) {
		if(StringUtils.isBlank(paymentToken)) {
			return;
		}
		String trimmed = paymentToken.trim();
		if(!trimmed.startsWith("{")) {
			return;
		}
		try {
			JSONObject json = new JSONObject(trimmed);
			for(String name : json.keySet()) {
				if(!json.isNull(name)) {
					metadata.put(name, String.valueOf(json.get(name)));
				}
			}
		} catch(Exception e) {
			// Malformed JSON is the shopper's payload, not a server fault. The
			// gateway module rejects the payment when the values it needs are
			// missing, which is a clearer failure than one thrown from here.
		}
	}

	@Override
	protected Payment createTarget() {
		// TODO Auto-generated method stub
		return null;
	}
	
	public PricingService getPricingService() {
		return pricingService;
	}

	public void setPricingService(PricingService pricingService) {
		this.pricingService = pricingService;
	}

}
