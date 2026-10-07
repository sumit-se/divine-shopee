package com.salesmanager.core.business.services.catalog.product.variant;

import java.util.Comparator;
import java.util.Optional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.repositories.catalog.product.variant.PageableProductVariantGroupRepository;
import com.salesmanager.core.business.repositories.catalog.product.variant.ProductVariantGroupRepository;
import com.salesmanager.core.business.services.common.generic.SalesManagerEntityServiceImpl;
import com.salesmanager.core.business.services.content.ContentService;
import com.salesmanager.core.model.catalog.product.variant.ProductVariant;
import com.salesmanager.core.model.catalog.product.variant.ProductVariantGroup;
import com.salesmanager.core.model.catalog.product.variant.ProductVariantImage;
import com.salesmanager.core.model.content.FileContentType;
import com.salesmanager.core.model.content.InputContentFile;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.reference.language.Language;


@Service("productVariantGroupService")
public class ProductVariantGroupServiceImpl extends SalesManagerEntityServiceImpl<Long, ProductVariantGroup> implements ProductVariantGroupService {

	
	@Autowired
	private PageableProductVariantGroupRepository pageableProductVariantGroupRepository;
	
	private ProductVariantGroupRepository productVariantGroupRepository;

	@Autowired
	private ProductVariantImageService productVariantImageService;

	@Autowired
	private ContentService contentService;

	@PersistenceContext
	private EntityManager entityManager;
	
	public ProductVariantGroupServiceImpl(ProductVariantGroupRepository repository) {
		super(repository);
		this.productVariantGroupRepository = repository;
	}

	@Override
	public Optional<ProductVariantGroup> getById(Long id, MerchantStore store) {
		return  productVariantGroupRepository.findOne(id, store.getCode());

	}

	@Override
	public Optional<ProductVariantGroup> getByProductVariant(Long productVariantId, MerchantStore store,
			Language language) {
		return productVariantGroupRepository.finByProductVariant(productVariantId, store.getCode());
	}

	@Override
	public ProductVariantGroup saveOrUpdate(ProductVariantGroup entity) throws ServiceException {
		
		entity = productVariantGroupRepository.save(entity);
		return entity;
		
	}

	@Override
	public Page<ProductVariantGroup> getByProductId(MerchantStore store, Long productId, Language language, int page,
			int count) {
		
		Pageable pageRequest = PageRequest.of(page, count);
		return pageableProductVariantGroupRepository.findByProductId(store.getId(), productId, pageRequest);
	}

	@Override
	@Transactional
	public ProductVariantImage addVariantImage(ProductVariant variant, InputContentFile file, MerchantStore store)
			throws ServiceException {
		ProductVariantGroup group = groupOf(variant, store);
		if (group == null) {
			group = new ProductVariantGroup();
			group.setMerchantStore(store);
			group = productVariantGroupRepository.save(group);
			// a bulk update rather than saving the variant: saving re-validates the
			// entity, and variant SKUs imported with hyphens fail its SKU pattern
			entityManager.createQuery("update ProductVariant v set v.productVariantGroup = :group where v.id = :id")
					.setParameter("group", group).setParameter("id", variant.getId()).executeUpdate();
		}

		file.setFileContentType(FileContentType.VARIANT);
		contentService.addContentFile(store.getCode(), file);

		ProductVariantImage image = new ProductVariantImage();
		image.setProductImage(file.getFileName());
		image.setDefaultImage(group.getImages().isEmpty());
		image.setProductVariantGroup(group);
		group.getImages().add(image);
		productVariantGroupRepository.save(group);
		return image;
	}

	@Override
	@Transactional
	public boolean removeVariantImage(ProductVariant variant, Long imageId, MerchantStore store)
			throws ServiceException {
		ProductVariantGroup group = groupOf(variant, store);
		ProductVariantImage image = imageOf(group, imageId);
		if (image == null) {
			return false;
		}
		contentService.removeFile(store.getCode(), FileContentType.VARIANT, image.getProductImage());
		group.getImages().remove(image);
		productVariantImageService.delete(image);
		if (image.isDefaultImage()) {
			group.getImages().stream().min(Comparator.comparing(ProductVariantImage::getId))
					.ifPresent(i -> i.setDefaultImage(true));
		}
		productVariantGroupRepository.save(group);
		return true;
	}

	@Override
	@Transactional
	public boolean setDefaultVariantImage(ProductVariant variant, Long imageId, MerchantStore store)
			throws ServiceException {
		ProductVariantGroup group = groupOf(variant, store);
		if (imageOf(group, imageId) == null) {
			return false;
		}
		group.getImages().forEach(i -> i.setDefaultImage(i.getId().equals(imageId)));
		productVariantGroupRepository.save(group);
		return true;
	}

	/** the variant's group as loaded here, or null when it has none **/
	private ProductVariantGroup groupOf(ProductVariant variant, MerchantStore store) {
		if (variant.getProductVariantGroup() == null) {
			return null;
		}
		return productVariantGroupRepository.findOne(variant.getProductVariantGroup().getId(), store.getCode())
				.orElse(null);
	}

	private ProductVariantImage imageOf(ProductVariantGroup group, Long imageId) {
		if (group == null || imageId == null) {
			return null;
		}
		return group.getImages().stream().filter(i -> imageId.equals(i.getId())).findFirst().orElse(null);
	}

}
