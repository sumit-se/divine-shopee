package com.salesmanager.core.business.repositories.catalog.product.alert;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.salesmanager.core.model.catalog.product.alert.StockAlert;

public interface StockAlertRepository extends JpaRepository<StockAlert, Long> {

	@Query("select a from StockAlert a where a.notifiedAt is null order by a.productId, a.createdAt")
	List<StockAlert> findPending();

	@Query("select a from StockAlert a where a.merchantId = ?1 and a.productId = ?2 and a.notifiedAt is null order by a.createdAt")
	List<StockAlert> findPending(Integer merchantId, Long productId);

	@Query("select a from StockAlert a where a.merchantId = ?1 and a.productId = ?2 and lower(a.email) = lower(?3) and a.notifiedAt is null")
	List<StockAlert> findPending(Integer merchantId, Long productId, String email);

	/** [productId, count] of shoppers still waiting, per product */
	@Query("select a.productId, count(a) from StockAlert a where a.merchantId = ?1 and a.notifiedAt is null group by a.productId")
	List<Object[]> countPendingByProduct(Integer merchantId);

	Optional<StockAlert> findByToken(String token);

}
