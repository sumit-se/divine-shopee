package com.salesmanager.core.modules.integration.shipping.model;

import java.util.List;

import org.json.simple.JSONAware;

public class CustomShippingQuotesRegion implements JSONAware {
	
	private String customRegionName;//a name given by the merchant for this custom region
	private List<String> countries;//a list of country code for this region
	/**
	 * optional: state / province codes (ZONE.ZONE_CODE, e.g. "UttarPradesh") the
	 * region is limited to. Empty means the whole of its countries. A region
	 * naming the delivery state wins over one that only names its country.
	 */
	private List<String> zones;
	
	private List<CustomShippingQuoteWeightItem> quoteItems;//price max weight

	public void setQuoteItems(List<CustomShippingQuoteWeightItem> quoteItems) {
		this.quoteItems = quoteItems;
	}

	public List<CustomShippingQuoteWeightItem> getQuoteItems() {
		return quoteItems;
	}

	public void setCountries(List<String> countries) {
		this.countries = countries;
	}

	public List<String> getCountries() {
		return countries;
	}

	public List<String> getZones() {
		return zones;
	}

	public void setZones(List<String> zones) {
		this.zones = zones;
	}

	public void setCustomRegionName(String customRegionName) {
		this.customRegionName = customRegionName;
	}

	public String getCustomRegionName() {
		return customRegionName;
	}
	

	public String toJSONString() {
		

		StringBuilder returnString = new StringBuilder();
		returnString.append("{");
		returnString.append("\"customRegionName\"").append(":\"").append(this.getCustomRegionName()).append("\"");
		
		
		
		if(countries!=null) {
			returnString.append(",");
			StringBuilder coutriesList = new StringBuilder();
			int countCountry = 0;
			coutriesList.append("[");
			for(String country : countries) {
				coutriesList.append("\"").append(country).append("\"");
				countCountry ++;
				if(countCountry<countries.size()) {
					coutriesList.append(",");
				}
			}
			
			coutriesList.append("]");
			returnString.append("\"countries\"").append(":").append(coutriesList.toString());
		}
		
		if(zones!=null) {
			returnString.append(",\"zones\":[");
			for(int i = 0; i < zones.size(); i++) {
				returnString.append("\"").append(zones.get(i)).append("\"");
				if(i < zones.size() - 1) {
					returnString.append(",");
				}
			}
			returnString.append("]");
		}

		if(quoteItems!=null) {
			returnString.append(",");
			StringBuilder quotesList = new StringBuilder();
			int countQuotes = 0;
			quotesList.append("[");
			for(CustomShippingQuoteWeightItem quote : quoteItems) {
				quotesList.append(quote.toJSONString());
				countQuotes ++;
				if(countQuotes<quoteItems.size()) {
					quotesList.append(",");
				}
			}
			quotesList.append("]");

			returnString.append("\"quoteItems\"").append(":").append(quotesList.toString());
		}
		returnString.append("}");
		return returnString.toString();
		
		
	}


}
