package com.salesmanager.shop.mapper.tax;

import java.util.List;
import java.util.Optional;

import org.apache.commons.lang3.Validate;
import org.springframework.stereotype.Component;

import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.reference.language.Language;
import com.salesmanager.core.model.tax.taxrate.TaxRate;
import com.salesmanager.core.model.tax.taxrate.TaxRateDescription;
import com.salesmanager.shop.mapper.Mapper;
import com.salesmanager.shop.model.tax.ReadableTaxRate;
import com.salesmanager.shop.model.tax.ReadableTaxRateDescription;

@Component
public class ReadableTaxRateMapper implements Mapper<TaxRate, ReadableTaxRate> {

	@Override
	public ReadableTaxRate convert(TaxRate source, MerchantStore store, Language language) {
		ReadableTaxRate taxRate = new ReadableTaxRate();
		return this.merge(source, taxRate, store, language);

	}

	@Override
	public ReadableTaxRate merge(TaxRate source, ReadableTaxRate destination, MerchantStore store,
								 Language language) {
		Validate.notNull(destination, "destination TaxRate cannot be null");
		Validate.notNull(source, "source TaxRate cannot be null");
		destination.setId(source.getId());
		destination.setCountry(source.getCountry().getIsoCode());
		destination.setZone(zoneOf(source));
		destination.setRate(source.getTaxRate().toString());
		destination.setCode(source.getCode());
		destination.setPriority(source.getTaxPriority());
		Optional<ReadableTaxRateDescription> description = this.convertDescription(source.getDescriptions(), language);
		if(description.isPresent()) {
			destination.setDescription(description.get());
		}
		return destination;
	}
	
	/**
	 * How this rate names the area it applies to.
	 *
	 * A tax rate targets either a known zone or a free-text province, and the
	 * write side puts the same string into both: setZone(byCode(s)) leaves the
	 * zone null when s is not a zone code, and setStateProvince(s) keeps the
	 * text regardless. Reading the zone back first and falling back to the text
	 * mirrors that, so a rate survives a read-edit-save round trip unchanged.
	 *
	 * Null when the rate has neither, which is not a broken row: a rate that
	 * applies to a whole country has no zone to name. India's GST rates are
	 * exactly this -- national, not per state -- and dereferencing the zone
	 * here is what made the tax rate list return 500 for the whole store.
	 */
	private String zoneOf(TaxRate source) {
		if (source.getZone() != null) {
			return source.getZone().getCode();
		}
		return source.getStateProvince();
	}

	private Optional<ReadableTaxRateDescription> convertDescription(List<TaxRateDescription> descriptions, Language language) {
		/*
		 * No descriptions is a thin rate, not a server fault: the caller
		 * already handles an absent description, so returning empty keeps one
		 * incomplete rate from failing the whole list the way the zone did.
		 */
		if (descriptions == null || descriptions.isEmpty()) {
			return Optional.empty();
		}

	    Optional<TaxRateDescription> description = descriptions.stream()
	            .filter(desc -> desc.getLanguage().getCode().equals(language.getCode())).findAny();
	        if (description.isPresent()) {
	          return Optional.of(convertDescription(description.get()));
	        } else {
	          return Optional.empty();
	        }
		
		
	}
	
	private ReadableTaxRateDescription convertDescription(TaxRateDescription desc) {
		ReadableTaxRateDescription d = new ReadableTaxRateDescription();
		d.setDescription(desc.getDescription());
		d.setName(desc.getName());
		d.setLanguage(desc.getLanguage().getCode());
		d.setDescription(desc.getDescription());
		d.setId(desc.getId());
		d.setTitle(desc.getTitle());
		return d;
	}



}
