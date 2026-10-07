package com.salesmanager.core.business.services.catalog.product.variant;

import java.util.Optional;

import org.springframework.data.domain.Page;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.services.common.generic.SalesManagerEntityService;
import com.salesmanager.core.model.catalog.product.variant.ProductVariant;
import com.salesmanager.core.model.catalog.product.variant.ProductVariantGroup;
import com.salesmanager.core.model.catalog.product.variant.ProductVariantImage;
import com.salesmanager.core.model.content.InputContentFile;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.reference.language.Language;

public interface ProductVariantGroupService extends SalesManagerEntityService<Long, ProductVariantGroup> {

	
	Optional<ProductVariantGroup> getById(Long id, MerchantStore store);
	
	Optional<ProductVariantGroup> getByProductVariant(Long productVariantId, MerchantStore store, Language language);

	Page<ProductVariantGroup> getByProductId(MerchantStore store, Long productId, Language language, int page, int count);

	ProductVariantGroup saveOrUpdate(ProductVariantGroup entity) throws ServiceException;

	/**
	 * Adds an image to a single variant. A variant without a group is given one
	 * of its own first, since Shopizer keeps variant images on the group. The
	 * first image of a group becomes its main image.
	 * @param file stored under FileContentType.VARIANT with its file name, which
	 * must be unique within the store
	 */
	ProductVariantImage addVariantImage(ProductVariant variant, InputContentFile file, MerchantStore store) throws ServiceException;

	/**
	 * Removes one of a variant's images, file included. When the main image goes,
	 * the oldest remaining one takes its place.
	 * @return false when the image is not one of the variant's
	 */
	boolean removeVariantImage(ProductVariant variant, Long imageId, MerchantStore store) throws ServiceException;

	/**
	 * Makes one of a variant's images its main image.
	 * @return false when the image is not one of the variant's
	 */
	boolean setDefaultVariantImage(ProductVariant variant, Long imageId, MerchantStore store) throws ServiceException;

}
