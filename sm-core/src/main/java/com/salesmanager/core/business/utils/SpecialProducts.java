package com.salesmanager.core.business.utils;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

import com.salesmanager.core.model.catalog.category.Category;
import com.salesmanager.core.model.catalog.product.Product;
import com.salesmanager.core.model.shoppingcart.ShoppingCartItem;

/**
 * Rules for the products in the hand-picked "Special" category (promotional
 * offers):
 *
 * - they are paid for up front, never cash on delivery;
 * - at most {@link #MAX_ORDER_QUANTITY} of each such product in one order, all
 *   its variants (beads) counted together.
 *
 * The storefront applies the same rules as the shopper goes; these are what
 * make them hold for any order, whatever it was placed with.
 */
public final class SpecialProducts {

	/** code of the Special category */
	public static final String CATEGORY_CODE = "special";

	public static final int MAX_ORDER_QUANTITY = 10;

	private SpecialProducts() {
	}

	public static boolean isSpecial(Product product) {
		if (product == null || product.getCategories() == null) {
			return false;
		}
		for (Category category : product.getCategories()) {
			if (category != null && CATEGORY_CODE.equalsIgnoreCase(category.getCode())) {
				return true;
			}
		}
		return false;
	}

	public static boolean containsSpecial(Collection<ShoppingCartItem> items) {
		if (items == null) {
			return false;
		}
		for (ShoppingCartItem item : items) {
			if (isSpecial(item.getProduct())) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @return the first Special product ordered more than the limit, or null
	 */
	public static Product overLimit(Collection<ShoppingCartItem> items) {
		if (items == null) {
			return null;
		}
		Map<Long, Integer> quantities = new LinkedHashMap<>();
		Map<Long, Product> products = new LinkedHashMap<>();
		for (ShoppingCartItem item : items) {
			Product product = item.getProduct();
			if (!isSpecial(product) || item.getQuantity() == null) {
				continue;
			}
			quantities.merge(product.getId(), item.getQuantity(), Integer::sum);
			products.put(product.getId(), product);
		}
		for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
			if (entry.getValue() > MAX_ORDER_QUANTITY) {
				return products.get(entry.getKey());
			}
		}
		return null;
	}

	/** the message a shopper sees when a Special product is ordered over the limit */
	public static String overLimitMessage(Product product) {
		String name = product.getSku();
		if (product.getDescriptions() != null && !product.getDescriptions().isEmpty()) {
			name = product.getDescriptions().iterator().next().getName();
		}
		return "You can order at most " + MAX_ORDER_QUANTITY + " of " + name + " (special offer) in one order";
	}

}
