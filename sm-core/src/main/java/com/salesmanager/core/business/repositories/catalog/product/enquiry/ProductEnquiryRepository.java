package com.salesmanager.core.business.repositories.catalog.product.enquiry;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.salesmanager.core.model.catalog.product.ProductEnquiry;

public interface ProductEnquiryRepository extends JpaRepository<ProductEnquiry, Long> {

	@Query("select e from ProductEnquiry as e join fetch e.merchantStore em where em.id = ?1 order by e.id desc")
	List<ProductEnquiry> findByStore(Integer storeId);
}
