package com.salesmanager.shop.utils;

import com.salesmanager.core.model.catalog.product.Product;
import com.salesmanager.core.model.catalog.product.availability.ProductAvailability;

/**
 * Whether a product has anything left to sell, from its real stock.
 *
 * A product with variants (beads) is sold through them, so it is sold out when
 * no available variant has stock -- its own inventory row is a placeholder that
 * usually says 1 and must not count. A product without variants uses its own
 * rows. This is stock only: switched-off and enquiry-only products are decided
 * separately.
 */
public final class ProductStock {

	private ProductStock() {
	}

	public static boolean soldOut(Product product) {
		boolean hasVariants = product.getVariants() != null && !product.getVariants().isEmpty();
		for (ProductAvailability stock : product.getAvailabilities()) {
			int quantity = stock.getProductQuantity() == null ? 0 : stock.getProductQuantity();
			if (quantity <= 0 || !stock.getProductStatus()) {
				continue;
			}
			if (hasVariants) {
				if (stock.getProductVariant() != null && stock.getProductVariant().isAvailable()) {
					return false;
				}
			} else if (stock.getProductVariant() == null) {
				return false;
			}
		}
		return true;
	}

}
