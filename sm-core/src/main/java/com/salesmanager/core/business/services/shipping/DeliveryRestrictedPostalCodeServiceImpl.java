package com.salesmanager.core.business.services.shipping;

import java.util.List;

import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.repositories.shipping.DeliveryRestrictedPostalCodeRepository;
import com.salesmanager.core.business.services.common.generic.SalesManagerEntityServiceImpl;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.shipping.DeliveryRestrictedPostalCode;

@Service("deliveryRestrictedPostalCodeService")
public class DeliveryRestrictedPostalCodeServiceImpl
		extends SalesManagerEntityServiceImpl<Long, DeliveryRestrictedPostalCode>
		implements DeliveryRestrictedPostalCodeService {

	private DeliveryRestrictedPostalCodeRepository deliveryRestrictedPostalCodeRepository;

	@Inject
	public DeliveryRestrictedPostalCodeServiceImpl(
			DeliveryRestrictedPostalCodeRepository deliveryRestrictedPostalCodeRepository) {
		super(deliveryRestrictedPostalCodeRepository);
		this.deliveryRestrictedPostalCodeRepository = deliveryRestrictedPostalCodeRepository;
	}

	@Override
	public List<DeliveryRestrictedPostalCode> listByStore(MerchantStore store) {
		return deliveryRestrictedPostalCodeRepository.findByStore(store.getId());
	}

	@Override
	public boolean isRestricted(MerchantStore store, String postalCode) {
		String normalized = normalize(postalCode);
		if (store == null || normalized == null) {
			return false;
		}
		return deliveryRestrictedPostalCodeRepository.findByStoreAndPostalCode(store.getId(), normalized) != null;
	}

	@Override
	public DeliveryRestrictedPostalCode add(MerchantStore store, String postalCode, String countryCode, String reason)
			throws ServiceException {
		String normalized = normalize(postalCode);
		if (normalized == null) {
			throw new ServiceException("A postal code is required");
		}
		DeliveryRestrictedPostalCode existing = deliveryRestrictedPostalCodeRepository
				.findByStoreAndPostalCode(store.getId(), normalized);
		if (existing != null) {
			return existing;
		}
		DeliveryRestrictedPostalCode restricted = new DeliveryRestrictedPostalCode(store, normalized);
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
