package com.salesmanager.core.business.services.shipping;

import java.util.List;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.services.common.generic.SalesManagerEntityService;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.shipping.DeliveryRestrictedPostalCode;

/**
 * The postal codes a store does not deliver to.
 */
public interface DeliveryRestrictedPostalCodeService
		extends SalesManagerEntityService<Long, DeliveryRestrictedPostalCode> {

	List<DeliveryRestrictedPostalCode> listByStore(MerchantStore store);

	/** True when the store will not ship an order to this postal code. */
	boolean isRestricted(MerchantStore store, String postalCode);

	DeliveryRestrictedPostalCode add(MerchantStore store, String postalCode, String countryCode, String reason)
			throws ServiceException;
}
