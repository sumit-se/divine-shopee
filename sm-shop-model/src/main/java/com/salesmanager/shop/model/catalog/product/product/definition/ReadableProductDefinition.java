package com.salesmanager.shop.model.catalog.product.product.definition;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.salesmanager.shop.model.catalog.category.ReadableCategory;
import com.salesmanager.shop.model.catalog.manufacturer.ReadableManufacturer;
import com.salesmanager.shop.model.catalog.product.ProductDescription;
import com.salesmanager.shop.model.catalog.product.ReadableImage;
import com.salesmanager.shop.model.catalog.product.attribute.PersistableProductAttribute;
import com.salesmanager.shop.model.catalog.product.inventory.ReadableInventory;
import com.salesmanager.shop.model.catalog.product.type.ReadableProductType;

public class ReadableProductDefinition extends ProductDefinition {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private ReadableProductType type;
	private List<ReadableCategory> categories = new ArrayList<ReadableCategory>();
	private ReadableManufacturer manufacturer;
	private ProductDescription description = null;
	private List<PersistableProductAttribute> properties = new ArrayList<PersistableProductAttribute>();
	private List<ReadableImage> images = new ArrayList<ReadableImage>();
	private ReadableInventory inventory;
	/**
	 * The default price's two amounts and the stock, as plain numbers.
	 *
	 * They are all readable off `inventory` already, but only as text the
	 * store has formatted ("Rs 7,321.00"), which an editor cannot put back in
	 * a number field. These are the same three values this product's
	 * persistable form accepts, so what is read back is what can be sent in.
	 */
	private BigDecimal price;
	private BigDecimal discountedPrice;
	private boolean memberExclusiveEnabled = false;
	private int memberDiscountPercent = 5;
	private Integer quantity;


	public ReadableProductType getType() {
		return type;
	}
	public void setType(ReadableProductType type) {
		this.type = type;
	}
	public List<ReadableCategory> getCategories() {
		return categories;
	}
	public void setCategories(List<ReadableCategory> categories) {
		this.categories = categories;
	}
	public ReadableManufacturer getManufacturer() {
		return manufacturer;
	}
	public void setManufacturer(ReadableManufacturer manufacturer) {
		this.manufacturer = manufacturer;
	}
	public List<PersistableProductAttribute> getProperties() {
		return properties;
	}
	public void setProperties(List<PersistableProductAttribute> properties) {
		this.properties = properties;
	}
	public ProductDescription getDescription() {
		return description;
	}
	public void setDescription(ProductDescription description) {
		this.description = description;
	}
	public List<ReadableImage> getImages() {
		return images;
	}
	public void setImages(List<ReadableImage> images) {
		this.images = images;
	}
	public ReadableInventory getInventory() {
		return inventory;
	}
	public void setInventory(ReadableInventory inventory) {
		this.inventory = inventory;
	}



	public BigDecimal getPrice() {
		return price;
	}
	public void setPrice(BigDecimal price) {
		this.price = price;
	}
	public BigDecimal getDiscountedPrice() {
		return discountedPrice;
	}
	public void setDiscountedPrice(BigDecimal discountedPrice) {
		this.discountedPrice = discountedPrice;
	}
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
	public Integer getQuantity() {
		return quantity;
	}
	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}
}
