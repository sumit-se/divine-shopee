package com.salesmanager.shop.populator.catalog;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.apache.commons.lang3.Validate;

import com.salesmanager.core.business.exception.ConversionException;
import com.salesmanager.core.business.services.catalog.pricing.PricingService;
import com.salesmanager.core.business.utils.AbstractDataPopulator;
import com.salesmanager.core.model.catalog.product.price.FinalPrice;
import com.salesmanager.core.model.catalog.product.price.ProductPrice;
import com.salesmanager.core.model.catalog.product.price.ProductPriceDescription;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.reference.language.Language;
import com.salesmanager.shop.model.catalog.product.ReadableProductPrice;
import com.salesmanager.shop.model.catalog.product.ReadableProductPriceFull;



public class ReadableProductPricePopulator extends
		AbstractDataPopulator<ProductPrice, ReadableProductPrice> {
	
	
	private PricingService pricingService;

	public PricingService getPricingService() {
		return pricingService;
	}

	public void setPricingService(PricingService pricingService) {
		this.pricingService = pricingService;
	}

	@Override
	public ReadableProductPrice populate(ProductPrice source,
			ReadableProductPrice target, MerchantStore store, Language language)
			throws ConversionException {
		Validate.notNull(pricingService,"pricingService must be set");
		Validate.notNull(source.getProductAvailability(),"productPrice.availability cannot be null");
		Validate.notNull(source.getProductAvailability().getProduct(),"productPrice.availability.product cannot be null");
		
		try {
		  
		    if(language == null) {
		      target = new ReadableProductPriceFull();
		    }
		    
		    if(source.getId() != null && source.getId() > 0) {
		      target.setId(source.getId());
		    }
		    
		    target.setDefaultPrice(source.isDefaultPrice());
			
			/*
			 * Priced from the availability this price belongs to, not from the
			 * product. A variant keeps its own inventory row, so pricing the
			 * product here reported the parent's discount state: a variant with
			 * its own special amount came back discounted=false with the
			 * undiscounted final price.
			 */
			FinalPrice finalPrice = pricingService.calculateProductPrice(source.getProductAvailability());
			
			target.setOriginalPrice(pricingService.getDisplayAmount(source.getProductPriceAmount(), store));
			if(finalPrice.isDiscounted()) {
				target.setDiscounted(true);
				target.setFinalPrice(pricingService.getDisplayAmount(source.getProductPriceSpecialAmount(), store));
			} else {
				target.setFinalPrice(pricingService.getDisplayAmount(finalPrice.getOriginalPrice(), store));
			}

			// the discount window, in the same yyyy-MM-dd the persistable side
			// parses, so a client can read it back and save it unchanged
			if (source.getProductPriceSpecialStartDate() != null) {
				target.setDiscountStartDate(
						com.salesmanager.shop.utils.DateUtil.formatDate(source.getProductPriceSpecialStartDate()));
			}
			if (source.getProductPriceSpecialEndDate() != null) {
				target.setDiscountEndDate(
						com.salesmanager.shop.utils.DateUtil.formatDate(source.getProductPriceSpecialEndDate()));
			}
			
		    if(source.getDescriptions()!=null && source.getDescriptions().size()>0) {
		       List<com.salesmanager.shop.model.catalog.product.ProductPriceDescription> fulldescriptions = new ArrayList<com.salesmanager.shop.model.catalog.product.ProductPriceDescription>();
	            
               Set<ProductPriceDescription> descriptions = source.getDescriptions();
               ProductPriceDescription description = null;
               for(ProductPriceDescription desc : descriptions) {
                   if(language != null && desc.getLanguage().getCode().equals(language.getCode())) {
                       description = desc;
                       break;
                   } else {
                     fulldescriptions.add(populateDescription(desc));
                   }
               }

               
               if (description != null) {
                   com.salesmanager.shop.model.catalog.product.ProductPriceDescription d = populateDescription(description);
                   target.setDescription(d);
               }
               
               if(target instanceof ReadableProductPriceFull) {
                 ((ReadableProductPriceFull)target).setDescriptions(fulldescriptions);
               }
		    }


		} catch(Exception e) {
			throw new ConversionException("Exception while converting to ReadableProductPrice",e);
		}
		
		
		
		return target;
	}

	@Override
	protected ReadableProductPrice createTarget() {
		// TODO Auto-generated method stub
		return null;
	}
	
	com.salesmanager.shop.model.catalog.product.ProductPriceDescription populateDescription(
	      ProductPriceDescription description) {
	    if (description == null) {
	      return null;
	    }
	    com.salesmanager.shop.model.catalog.product.ProductPriceDescription d =
	        new com.salesmanager.shop.model.catalog.product.ProductPriceDescription();
	    d.setName(description.getName());
	    d.setDescription(description.getDescription());
	    d.setId(description.getId());
	    d.setTitle(description.getTitle());
	    if (description.getLanguage() != null) {
	      d.setLanguage(description.getLanguage().getCode());
	    }
	    return d;
	 }

}
