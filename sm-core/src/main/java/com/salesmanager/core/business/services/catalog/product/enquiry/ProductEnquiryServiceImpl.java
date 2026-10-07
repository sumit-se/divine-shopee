package com.salesmanager.core.business.services.catalog.product.enquiry;

import java.util.List;

import javax.inject.Inject;

import org.springframework.stereotype.Service;

import com.salesmanager.core.business.repositories.catalog.product.enquiry.ProductEnquiryRepository;
import com.salesmanager.core.business.services.common.generic.SalesManagerEntityServiceImpl;
import com.salesmanager.core.model.catalog.product.ProductEnquiry;
import com.salesmanager.core.model.merchant.MerchantStore;

@Service("productEnquiryService")
public class ProductEnquiryServiceImpl extends SalesManagerEntityServiceImpl<Long, ProductEnquiry>
		implements ProductEnquiryService {

	private ProductEnquiryRepository productEnquiryRepository;

	@Inject
	public ProductEnquiryServiceImpl(ProductEnquiryRepository productEnquiryRepository) {
		super(productEnquiryRepository);
		this.productEnquiryRepository = productEnquiryRepository;
	}

	@Override
	public List<ProductEnquiry> listByStore(MerchantStore store) {
		return productEnquiryRepository.findByStore(store.getId());
	}
}
