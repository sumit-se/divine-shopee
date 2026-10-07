package com.salesmanager.core.business.services.shipping;

import java.util.List;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.services.common.generic.SalesManagerEntityService;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.shipping.CodRestrictedPostalCode;

/**
 * The postal codes a store will not take cash on delivery from.
 */
public interface CodRestrictedPostalCodeService
		extends SalesManagerEntityService<Long, CodRestrictedPostalCode> {

	List<CodRestrictedPostalCode> listByStore(MerchantStore store);

	/** True when cash on delivery must not be offered for this postal code. */
	boolean isRestricted(MerchantStore store, String postalCode);

	CodRestrictedPostalCode add(MerchantStore store, String postalCode, String countryCode, String reason)
			throws ServiceException;
}
