package com.salesmanager.shop.model.catalog.product;

import java.io.Serializable;
import com.salesmanager.shop.model.entity.Entity;

public class ReadableProductPrice extends Entity implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private String originalPrice;
	private String finalPrice;
	private boolean defaultPrice = false;
	private boolean discounted = false;
	/**
	 * Discount window, so a client can show and re-save it. Without these the
	 * admin could set a window but never read it back, and the next save wiped it.
	 */
	private String discountStartDate;
	private String discountEndDate;

	public String getDiscountStartDate() {
		return discountStartDate;
	}
	public void setDiscountStartDate(String discountStartDate) {
		this.discountStartDate = discountStartDate;
	}
	public String getDiscountEndDate() {
		return discountEndDate;
	}
	public void setDiscountEndDate(String discountEndDate) {
		this.discountEndDate = discountEndDate;
	}
	private ProductPriceDescription description;

	public String getOriginalPrice() {
		return originalPrice;
	}

	public void setOriginalPrice(String originalPrice) {
		this.originalPrice = originalPrice;
	}

	public String getFinalPrice() {
		return finalPrice;
	}

	public void setFinalPrice(String finalPrice) {
		this.finalPrice = finalPrice;
	}

	public boolean isDiscounted() {
		return discounted;
	}

	public void setDiscounted(boolean discounted) {
		this.discounted = discounted;
	}

	public ProductPriceDescription getDescription() {
		return description;
	}

	public void setDescription(ProductPriceDescription description) {
		this.description = description;
	}

	public boolean isDefaultPrice() {
		return defaultPrice;
	}

	public void setDefaultPrice(boolean defaultPrice) {
		this.defaultPrice = defaultPrice;
	}

}
