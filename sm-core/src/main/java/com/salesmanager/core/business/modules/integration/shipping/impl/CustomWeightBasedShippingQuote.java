package com.salesmanager.core.business.modules.integration.shipping.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.services.system.MerchantConfigurationService;
import com.salesmanager.core.business.utils.ProductPriceUtils;
import com.salesmanager.core.model.common.Delivery;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.shipping.PackageDetails;
import com.salesmanager.core.model.shipping.ShippingBasisType;
import com.salesmanager.core.model.shipping.ShippingConfiguration;
import com.salesmanager.core.model.shipping.ShippingOption;
import com.salesmanager.core.model.shipping.ShippingOrigin;
import com.salesmanager.core.model.shipping.ShippingQuote;
import com.salesmanager.core.model.system.CustomIntegrationConfiguration;
import com.salesmanager.core.model.system.IntegrationConfiguration;
import com.salesmanager.core.model.system.IntegrationModule;
import com.salesmanager.core.model.system.MerchantConfiguration;
import com.salesmanager.core.modules.integration.IntegrationException;
import com.salesmanager.core.modules.integration.shipping.model.CustomShippingQuoteWeightItem;
import com.salesmanager.core.modules.integration.shipping.model.CustomShippingQuotesConfiguration;
import com.salesmanager.core.modules.integration.shipping.model.CustomShippingQuotesRegion;
import com.salesmanager.core.modules.integration.shipping.model.ShippingQuoteModule;


public class CustomWeightBasedShippingQuote implements ShippingQuoteModule {
	
	public final static String MODULE_CODE = "weightBased";
	private final static String CUSTOM_WEIGHT = "CUSTOM_WEIGHT";
	
	@Inject
	private MerchantConfigurationService merchantConfigurationService;
	
	@Inject
	private ProductPriceUtils productPriceUtils;


	@Override
	public void validateModuleConfiguration(
			IntegrationConfiguration integrationConfiguration,
			MerchantStore store) throws IntegrationException {
		
		
		//not used, it has its own controller with complex validators

	}
	

	@Override
	public CustomIntegrationConfiguration getCustomModuleConfiguration(
			MerchantStore store) throws IntegrationException {

		try {

			MerchantConfiguration configuration = merchantConfigurationService.getMerchantConfiguration(MODULE_CODE, store);
	
			if(configuration!=null) {
				String value = configuration.getValue();
				ObjectMapper mapper = new ObjectMapper();
				try {
					return mapper.readValue(value, CustomShippingQuotesConfiguration.class);
				} catch(Exception e) {
					throw new ServiceException("Cannot parse json string " + value);
				}
	
			} else {
				CustomShippingQuotesConfiguration custom = new CustomShippingQuotesConfiguration();
				custom.setModuleCode(MODULE_CODE);
				return custom;
			}
		
		} catch (Exception e) {
			throw new IntegrationException(e);
		}
		
		
	}

	@Override
	public List<ShippingOption> getShippingQuotes(
			ShippingQuote shippingQuote,
			List<PackageDetails> packages, BigDecimal orderTotal,
			Delivery delivery, ShippingOrigin origin, MerchantStore store,
			IntegrationConfiguration configuration, IntegrationModule module,
			ShippingConfiguration shippingConfiguration, Locale locale)
			throws IntegrationException {

		// prices depend on the state, so a chosen state is enough to quote: the
		// shopper sees the delivery price as soon as they pick it, before typing
		// a postcode
		boolean hasState = (delivery.getZone() != null && StringUtils.isNotBlank(delivery.getZone().getCode()))
				|| StringUtils.isNotBlank(delivery.getState());
		if(StringUtils.isBlank(delivery.getPostalCode()) && !hasState) {
			return null;
		}
		
		//get configuration
		CustomShippingQuotesConfiguration customConfiguration = (CustomShippingQuotesConfiguration)this.getCustomModuleConfiguration(store);
		
		
		List<CustomShippingQuotesRegion> regions = customConfiguration.getRegions();
		
		ShippingBasisType shippingType =  shippingConfiguration.getShippingBasisType();
		ShippingOption shippingOption = null;
		try {
			

			// parcel weight, in the store's unit (kg)
			double weight = 0;
			for(PackageDetails packageDetail : packages) {
				weight = weight + packageDetail.getShippingWeight();
			}

			CustomShippingQuotesRegion region = matchingRegion(regions, delivery);
			if(region != null && region.getQuoteItems() != null) {
				// lightest band first, whatever order they were saved in
				List<CustomShippingQuoteWeightItem> quoteItems = new ArrayList<CustomShippingQuoteWeightItem>(region.getQuoteItems());
				quoteItems.sort(java.util.Comparator.comparingDouble(CustomShippingQuoteWeightItem::getMaximumWeight));
				for(CustomShippingQuoteWeightItem quoteItem : quoteItems) {
					if(weight <= quoteItem.getMaximumWeight()) {
						shippingOption = new ShippingOption();
						shippingOption.setOptionCode(new StringBuilder().append(CUSTOM_WEIGHT).toString());
						shippingOption.setOptionId(new StringBuilder().append(CUSTOM_WEIGHT).append("_").append(region.getCustomRegionName()).toString());
						shippingOption.setOptionPrice(quoteItem.getPrice());
						shippingOption.setOptionPriceText(productPriceUtils.getStoreFormatedAmountWithCurrency(store, quoteItem.getPrice()));
						break;
					}
				}
			}

			if(shippingOption!=null) {
				List<ShippingOption> options = new ArrayList<ShippingOption>();
				options.add(shippingOption);
				return options;
			}
			
			return null;
		
		} catch (Exception e) {
			throw new IntegrationException(e);
		}

	}




	/**
	 * The region that prices a delivery: one naming the delivery's state
	 * (zones) wins over one that only names its country, so "UP & Delhi" and
	 * "Rest of India" can sit side by side. Zone is matched on its code, or on
	 * the state text when the address carries no zone.
	 */
	private CustomShippingQuotesRegion matchingRegion(List<CustomShippingQuotesRegion> regions, Delivery delivery) {
		if(regions == null || delivery.getCountry() == null) {
			return null;
		}
		String country = delivery.getCountry().getIsoCode();
		String zone = delivery.getZone() != null && StringUtils.isNotBlank(delivery.getZone().getCode())
				? delivery.getZone().getCode() : delivery.getState();
		CustomShippingQuotesRegion countryWide = null;
		for(CustomShippingQuotesRegion region : regions) {
			if(region.getCountries() == null || !region.getCountries().contains(country)) {
				continue;
			}
			if(region.getZones() == null || region.getZones().isEmpty()) {
				if(countryWide == null) {
					countryWide = region;
				}
			} else if(zone != null && region.getZones().stream().anyMatch(z -> z.equalsIgnoreCase(zone.trim()))) {
				return region;
			}
		}
		return countryWide;
	}

}
