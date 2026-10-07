package com.salesmanager.core.business.repositories.shipping;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.salesmanager.core.model.shipping.DeliveryRestrictedPostalCode;

public interface DeliveryRestrictedPostalCodeRepository extends JpaRepository<DeliveryRestrictedPostalCode, Long> {

	@Query("select c from DeliveryRestrictedPostalCode as c join fetch c.merchantStore cm where cm.id = ?1 order by c.postalCode")
	List<DeliveryRestrictedPostalCode> findByStore(Integer storeId);

	/**
	 * The postcode is matched as stored: normalised (no spaces, upper case) by
	 * the service on the way in and on the way out, so "201 301" finds "201301".
	 */
	@Query("select c from DeliveryRestrictedPostalCode as c join fetch c.merchantStore cm "
			+ "where cm.id = ?1 and c.postalCode = ?2 and c.active = true")
	DeliveryRestrictedPostalCode findByStoreAndPostalCode(Integer storeId, String postalCode);
}
