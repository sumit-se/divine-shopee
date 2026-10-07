package com.salesmanager.core.business.services.shoppingcart;

import java.util.List;

import org.springframework.data.domain.Page;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.services.common.generic.SalesManagerEntityService;
import com.salesmanager.core.model.catalog.product.Product;
import com.salesmanager.core.model.catalog.product.variant.ProductVariant;
import com.salesmanager.core.model.customer.Customer;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.shipping.ShippingProduct;
import com.salesmanager.core.model.shoppingcart.ShoppingCart;
import com.salesmanager.core.model.shoppingcart.ShoppingCartItem;

public interface ShoppingCartService extends SalesManagerEntityService<Long, ShoppingCart> {

	ShoppingCart getShoppingCart(Customer customer, MerchantStore store) throws ServiceException;

	void saveOrUpdate(ShoppingCart shoppingCart) throws ServiceException;

	ShoppingCart getById(Long id, MerchantStore store) throws ServiceException;

	ShoppingCart getByCode(String code, MerchantStore store) throws ServiceException;


	/**
	 * Creates a list of ShippingProduct based on the ShoppingCart if items are
	 * virtual return list will be null
	 * 
	 * @param cart
	 * @return
	 * @throws ServiceException
	 */
	List<ShippingProduct> createShippingProduct(ShoppingCart cart) throws ServiceException;

	/**
	 * Populates a ShoppingCartItem from a Product and attributes if any. Calculate price based on availability
	 * 
	 * @param product
	 * @return
	 * @throws ServiceException
	 */
	ShoppingCartItem populateShoppingCartItem(Product product, MerchantStore store) throws ServiceException;

	void deleteCart(ShoppingCart cart) throws ServiceException;

	void removeShoppingCart(ShoppingCart cart) throws ServiceException;

	/**
	 *
	 * @param userShoppingModel
	 * @param sessionCart
	 * @param store
	 * @return {@link ShoppingCart} merged Shopping Cart
	 * @throws Exception
	 */
	ShoppingCart mergeShoppingCarts(final ShoppingCart userShoppingCart, final ShoppingCart sessionCart,
			final MerchantStore store) throws Exception;


	/**
	 * Removes a shopping cart item
	 * @param item
	 */
	void deleteShoppingCartItem(Long id);

	/**
	 * Admin listing of a store's carts, most recently modified first. Line items
	 * are initialized; nothing is priced or modified.
	 * @param status ACTIVE, ORDERED or ALL
	 */
	Page<ShoppingCart> listByStore(MerchantStore store, String status, int page, int count) throws ServiceException;

	/**
	 * Admin view of a cart: items are priced like the storefront prices them, but
	 * unlike getById the cart is never updated, cleaned up or deleted. Items whose
	 * product no longer exists are flagged obsolete and left unpriced.
	 */
	ShoppingCart getReadOnly(Long id, MerchantStore store) throws ServiceException;

	/**
	 * Admin removal of a cart with its items and any shipping quotes computed for
	 * it. An order placed from the cart is not affected.
	 * @return false when the store has no such cart
	 */
	boolean deleteCart(Long id, MerchantStore store) throws ServiceException;

}
