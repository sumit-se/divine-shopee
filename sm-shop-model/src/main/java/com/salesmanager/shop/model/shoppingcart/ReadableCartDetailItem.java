package com.salesmanager.shop.model.shoppingcart;

import java.io.Serializable;

/**
 * A cart line in the admin cart view. available is false when the product no longer exists;
 * such a line has no price.
 */
public class ReadableCartDetailItem implements Serializable {

	private static final long serialVersionUID = 1L;

	private Long productId;
	private String sku;
	private String name;
	private Long variant;
	private String variantSku;
	private int quantity;
	private String displayPrice;
	private String displaySubTotal;
	private boolean available;

	public Long getProductId() {
		return productId;
	}

	public void setProductId(Long productId) {
		this.productId = productId;
	}

	public String getSku() {
		return sku;
	}

	public void setSku(String sku) {
		this.sku = sku;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Long getVariant() {
		return variant;
	}

	public void setVariant(Long variant) {
		this.variant = variant;
	}

	public String getVariantSku() {
		return variantSku;
	}

	public void setVariantSku(String variantSku) {
		this.variantSku = variantSku;
	}

	public int getQuantity() {
		return quantity;
	}

	public void setQuantity(int quantity) {
		this.quantity = quantity;
	}

	public String getDisplayPrice() {
		return displayPrice;
	}

	public void setDisplayPrice(String displayPrice) {
		this.displayPrice = displayPrice;
	}

	public String getDisplaySubTotal() {
		return displaySubTotal;
	}

	public void setDisplaySubTotal(String displaySubTotal) {
		this.displaySubTotal = displaySubTotal;
	}

	public boolean isAvailable() {
		return available;
	}

	public void setAvailable(boolean available) {
		this.available = available;
	}

}
