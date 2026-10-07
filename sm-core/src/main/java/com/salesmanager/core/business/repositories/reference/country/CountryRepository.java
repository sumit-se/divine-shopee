package com.salesmanager.core.business.repositories.reference.country;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.salesmanager.core.model.reference.country.Country;


public interface CountryRepository extends JpaRepository <Country, Integer> {
	
	@Query("select c from Country c left join fetch c.descriptions cd where c.isoCode=?1")
	Country findByIsoCode(String code);
	

	// 'distinct' is required: the two left join fetches below are on COLLECTIONS
	// (zones, and each zone's descriptions), so without it JPA returns one row
	// per joined leaf and the same Country is repeated. India has 36 zones and
	// there are 4 languages, so India came back 144 times -- which surfaced as
	// 144 identical entries in the checkout country selector. The sibling query
	// listCountryZonesByLanguage below already does this correctly.
	@Query("select distinct c from Country c "
			+ "left join fetch c.descriptions cd "
			+ "left join fetch c.zones cz left join fetch cz.descriptions "
			+ "where cd.language.id=?1")
	List<Country> listByLanguage(Integer id);
	
	/** get country including zones by language **/
	@Query("select distinct c from Country c left join fetch c.descriptions cd left join fetch c.zones cz left join fetch cz.descriptions where cd.language.id=?1")
	List<Country> listCountryZonesByLanguage(Integer id);

}
