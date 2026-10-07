package com.salesmanager.core.model.shipping;

import java.math.BigDecimal;

import com.salesmanager.core.model.catalog.product.Product;
import com.salesmanager.core.model.catalog.product.variant.ProductVariant;
import com.salesmanager.core.model.catalog.product.price.FinalPrice;

public class ShippingProduct {
	
	public ShippingProduct(Product product) {
		this.product = product;

	}
	
	private int quantity = 1;
	private Product product;
	/** the variant sold, when the line is for one **/
	private ProductVariant variant;
	
	private FinalPrice finalPrice;
	
	
	
	public void setQuantity(int quantity) {
		this.quantity = quantity;
	}
	public int getQuantity() {
		return quantity;
	}
	public void setProduct(Product product) {
		this.product = product;
	}
	public Product getProduct() {
		return product;
	}
	public FinalPrice getFinalPrice() {
		return finalPrice;
	}
	public void setFinalPrice(FinalPrice finalPrice) {
		this.finalPrice = finalPrice;
	}

	public ProductVariant getVariant() {
		return variant;
	}
	public void setVariant(ProductVariant variant) {
		this.variant = variant;
	}

	/*
	 * Dimensions to ship with: the variant's own where it has one, otherwise the
	 * product's. May still be null when neither is set.
	 */
	public BigDecimal getShippingWeight() {
		return variant != null && variant.getVariantWeight() != null ? variant.getVariantWeight() : product.getProductWeight();
	}
	public BigDecimal getShippingWidth() {
		return variant != null && variant.getVariantWidth() != null ? variant.getVariantWidth() : product.getProductWidth();
	}
	public BigDecimal getShippingHeight() {
		return variant != null && variant.getVariantHeight() != null ? variant.getVariantHeight() : product.getProductHeight();
	}
	public BigDecimal getShippingLength() {
		return variant != null && variant.getVariantLength() != null ? variant.getVariantLength() : product.getProductLength();
	}

}
