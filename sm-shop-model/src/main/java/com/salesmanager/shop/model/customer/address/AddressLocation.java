package com.salesmanager.shop.model.customer.address;

import java.io.Serializable;

public class AddressLocation implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	private String postalCode;
	private String countryCode;
	/** state / province code (ZONE.ZONE_CODE, e.g. "UttarPradesh"); shipping can be priced by state */
	private String zoneCode;

	public String getZoneCode() {
		return zoneCode;
	}

	public void setZoneCode(String zoneCode) {
		this.zoneCode = zoneCode;
	}
	
	public String getPostalCode() {
		return postalCode;
	}

	public void setPostalCode(String postalCode) {
		this.postalCode = postalCode;
	}

  public String getCountryCode() {
    return countryCode;
  }

  public void setCountryCode(String countryCode) {
    this.countryCode = countryCode;
  }

}
