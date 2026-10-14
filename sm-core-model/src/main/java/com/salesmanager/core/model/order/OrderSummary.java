package com.salesmanager.core.model.order;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import com.salesmanager.core.model.shipping.ShippingSummary;
import com.salesmanager.core.model.shoppingcart.ShoppingCartItem;


/**
 * This object is used as input object for many services
 * such as order total calculation and tax calculation
 * @author Carl Samson
 *
 */
public class OrderSummary implements Serializable {
	
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private OrderSummaryType orderSummaryType = OrderSummaryType.ORDERTOTAL;
	private ShippingSummary shippingSummary;
	private String promoCode;
	/*
	 * Which way the shopper has chosen to pay, when they have chosen yet. It
	 * belongs here for the same reason promoCode does: it is a checkout-time
	 * input that changes the total, and the calculation is the one place that
	 * should decide what it changes it by. Cash on delivery carries a
	 * convenience fee; everything else leaves the total alone.
	 */
	private String paymentMethodCode;
	private List<ShoppingCartItem> products = new ArrayList<ShoppingCartItem>();

	public void setProducts(List<ShoppingCartItem> products) {
		this.products = products;
	}
	public List<ShoppingCartItem> getProducts() {
		return products;
	}
	public void setShippingSummary(ShippingSummary shippingSummary) {
		this.shippingSummary = shippingSummary;
	}
	public ShippingSummary getShippingSummary() {
		return shippingSummary;
	}
	public OrderSummaryType getOrderSummaryType() {
		return orderSummaryType;
	}
	public void setOrderSummaryType(OrderSummaryType orderSummaryType) {
		this.orderSummaryType = orderSummaryType;
	}
	public String getPaymentMethodCode() {
		return paymentMethodCode;
	}

	public void setPaymentMethodCode(String paymentMethodCode) {
		this.paymentMethodCode = paymentMethodCode;
	}

	public String getPromoCode() {
		return promoCode;
	}
	public void setPromoCode(String promoCode) {
		this.promoCode = promoCode;
	}

}
