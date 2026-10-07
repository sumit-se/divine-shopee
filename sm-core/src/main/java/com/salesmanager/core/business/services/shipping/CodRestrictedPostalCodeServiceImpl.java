package com.salesmanager.core.business.services.shipping;

import java.util.List;

import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.repositories.shipping.CodRestrictedPostalCodeRepository;
import com.salesmanager.core.business.services.common.generic.SalesManagerEntityServiceImpl;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.shipping.CodRestrictedPostalCode;

@Service("codRestrictedPostalCodeService")
public class CodRestrictedPostalCodeServiceImpl
		extends SalesManagerEntityServiceImpl<Long, CodRestrictedPostalCode>
		implements CodRestrictedPostalCodeService {

	private CodRestrictedPostalCodeRepository codRestrictedPostalCodeRepository;

	@Inject
	public CodRestrictedPostalCodeServiceImpl(
			CodRestrictedPostalCodeRepository codRestrictedPostalCodeRepository) {
		super(codRestrictedPostalCodeRepository);
		this.codRestrictedPostalCodeRepository = codRestrictedPostalCodeRepository;
	}

	@Override
	public List<CodRestrictedPostalCode> listByStore(MerchantStore store) {
		return codRestrictedPostalCodeRepository.findByStore(store.getId());
	}

	@Override
	public boolean isRestricted(MerchantStore store, String postalCode) {
		String normalized = normalize(postalCode);
		if (store == null || normalized == null) {
			return false;
		}
		return codRestrictedPostalCodeRepository.findByStoreAndPostalCode(store.getId(), normalized) != null;
	}

	@Override
	public CodRestrictedPostalCode add(MerchantStore store, String postalCode, String countryCode, String reason)
			throws ServiceException {
		String normalized = normalize(postalCode);
		if (normalized == null) {
			throw new ServiceException("A postal code is required");
		}
		CodRestrictedPostalCode existing = codRestrictedPostalCodeRepository
				.findByStoreAndPostalCode(store.getId(), normalized);
		if (existing != null) {
			return existing;
		}
		CodRestrictedPostalCode restricted = new CodRestrictedPostalCode(store, normalized);
		restricted.setCountryCode(countryCode);
		restricted.setReason(reason);
		this.save(restricted);
		return restricted;
	}

	/**
	 * Shoppers type postcodes with spaces and in either case; the stored form has
	 * neither, so both ends have to agree on it.
	 */
	private String normalize(String postalCode) {
		if (StringUtils.isBlank(postalCode)) {
			return null;
		}
		return StringUtils.deleteWhitespace(postalCode).toUpperCase();
	}
}
