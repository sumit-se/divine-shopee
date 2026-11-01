package com.salesmanager.core.business.repositories.catalog.product.variant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;

import com.salesmanager.core.model.catalog.product.variant.ProductVariant;

public interface PageableProductVariantRepositoty extends PagingAndSortingRepository<ProductVariant, Long> {


	
	@Query(value = "select p from ProductVariant p "
			+ "join fetch p.product pr "
			+ "left join fetch p.variation pv "
			+ "left join fetch pv.productOption pvpo "
			+ "left join fetch pv.productOptionValue pvpov "
			+ "left join fetch p.variationValue pvv "
			+ "left join fetch pvv.productOption pvvpo "
			+ "left join fetch pvv.productOptionValue pvvpov "
			+ "left join fetch p.productVariantGroup pig "
			+ "left join fetch pr.merchantStore prm "
			+ "where pr.id = ?2 and prm.id = ?1",
			countQuery = "select count(p) from ProductVariant p "
					+ "join p.product pr "
					+ "join pr.merchantStore prm "
					+ "where pr.id = ?2 and prm.id = ?1")
	Page<ProductVariant> findByProductId(Integer storeId, Long productId, Pageable pageable);


}
