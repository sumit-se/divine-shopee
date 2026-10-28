package com.salesmanager.shop.model.catalog.product.product;

import java.io.Serializable;
import java.math.BigDecimal;

import com.salesmanager.shop.model.catalog.product.Product;

/**
 * A product entity is used by services API to populate or retrieve a Product
 * entity
 * 
 * @author Carl Samson
 *
 */
public class ProductEntity extends Product implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	private BigDecimal price;
	private int quantity = 0;
	private String sku;
	private boolean preOrder = false;
	private boolean productVirtual = false;
	private int quantityOrderMaximum = -1;// default unlimited
	private int quantityOrderMinimum = 1;// default 1
	private boolean productIsFree;

	private ProductSpecification productSpecifications;
	private Double rating = 0D;
	private int ratingCount;
	private int sortOrder;
	private String refSku;


	/**
	 * RENTAL additional fields
	 * 
	 * @return
	 */

	private int rentalDuration;
	private int rentalPeriod;

	/**
	 * End RENTAL fields
	 *
	 * @return
	 */

	/** True when this product has a MEMBER_EXCLUSIVE price — always set, regardless of authentication. */
	private boolean memberExclusiveEnabled = false;
	/** Discount percentage applied to get the member exclusive price (e.g. 10 = 10% off). */
	private int memberDiscountPercent = 0;
	/** Formatted member exclusive price string, e.g. "₹4,788.90" (discount applied on top of sale price). */
	private String memberExclusivePrice;

	public boolean isMemberExclusiveEnabled() {
		return memberExclusiveEnabled;
	}

	public void setMemberExclusiveEnabled(boolean memberExclusiveEnabled) {
		this.memberExclusiveEnabled = memberExclusiveEnabled;
	}

	public int getMemberDiscountPercent() {
		return memberDiscountPercent;
	}

	public void setMemberDiscountPercent(int memberDiscountPercent) {
		this.memberDiscountPercent = memberDiscountPercent;
	}

	public String getMemberExclusivePrice() {
		return memberExclusivePrice;
	}

	public void setMemberExclusivePrice(String memberExclusivePrice) {
		this.memberExclusivePrice = memberExclusivePrice;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public void setPrice(BigDecimal price) {
		this.price = price;
	}

	public int getQuantity() {
		return quantity;
	}

	public void setQuantity(int quantity) {
		this.quantity = quantity;
	}

	public String getSku() {
		return sku;
	}

	public void setSku(String sku) {
		this.sku = sku;
	}


	public boolean isProductIsFree() {
		return productIsFree;
	}

	public void setProductIsFree(boolean productIsFree) {
		this.productIsFree = productIsFree;
	}

	public int getSortOrder() {
		return sortOrder;
	}

	public void setSortOrder(int sortOrder) {
		this.sortOrder = sortOrder;
	}

	public void setQuantityOrderMaximum(int quantityOrderMaximum) {
		this.quantityOrderMaximum = quantityOrderMaximum;
	}

	public int getQuantityOrderMaximum() {
		return quantityOrderMaximum;
	}

	public void setProductVirtual(boolean productVirtual) {
		this.productVirtual = productVirtual;
	}

	public boolean isProductVirtual() {
		return productVirtual;
	}

	public int getQuantityOrderMinimum() {
		return quantityOrderMinimum;
	}

	public void setQuantityOrderMinimum(int quantityOrderMinimum) {
		this.quantityOrderMinimum = quantityOrderMinimum;
	}

	public int getRatingCount() {
		return ratingCount;
	}

	public void setRatingCount(int ratingCount) {
		this.ratingCount = ratingCount;
	}

	public Double getRating() {
		return rating;
	}

	public void setRating(Double rating) {
		this.rating = rating;
	}

	public boolean isPreOrder() {
		return preOrder;
	}

	public void setPreOrder(boolean preOrder) {
		this.preOrder = preOrder;
	}

	public String getRefSku() {
		return refSku;
	}

	public void setRefSku(String refSku) {
		this.refSku = refSku;
	}

	public int getRentalDuration() {
		return rentalDuration;
	}

	public void setRentalDuration(int rentalDuration) {
		this.rentalDuration = rentalDuration;
	}

	public int getRentalPeriod() {
		return rentalPeriod;
	}

	public void setRentalPeriod(int rentalPeriod) {
		this.rentalPeriod = rentalPeriod;
	}

	public ProductSpecification getProductSpecifications() {
		return productSpecifications;
	}

	public void setProductSpecifications(ProductSpecification productSpecifications) {
		this.productSpecifications = productSpecifications;
	}



}
