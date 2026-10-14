package com.salesmanager.shop.model.order.transaction;

import java.io.Serializable;

import com.salesmanager.shop.model.entity.Entity;

/**
 * Readable version of Transaction entity object
 * @author c.samson
 *
 */
public class TransactionEntity extends Entity implements Serializable {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private Long orderId;
	private String details;
	private String transactionDate;
	private String amount;
	/**
	 * The transaction's structured details.
	 *
	 * Transaction has always carried a Map alongside the single `details`
	 * string, but nothing exposed it, so a gateway that needs to hand several
	 * values to the storefront had no way through. Razorpay's init needs to
	 * return an order id and a key id together.
	 */
	private java.util.Map<String,String> transactionDetails;
	
	
	public String getTransactionDate() {
		return transactionDate;
	}
	public void setTransactionDate(String transactionDate) {
		this.transactionDate = transactionDate;
	}
	public Long getOrderId() {
		return orderId;
	}
	public void setOrderId(Long orderId) {
		this.orderId = orderId;
	}
	public String getDetails() {
		return details;
	}
	public void setDetails(String details) {
		this.details = details;
	}
	public java.util.Map<String,String> getTransactionDetails() {
		return transactionDetails;
	}
	public void setTransactionDetails(java.util.Map<String,String> transactionDetails) {
		this.transactionDetails = transactionDetails;
	}
	public String getAmount() {
		return amount;
	}
	public void setAmount(String amount) {
		this.amount = amount;
	}


}
