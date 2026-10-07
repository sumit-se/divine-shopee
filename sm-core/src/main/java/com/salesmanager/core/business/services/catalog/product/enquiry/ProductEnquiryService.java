package com.salesmanager.core.business.services.catalog.product.enquiry;

import java.util.List;

import com.salesmanager.core.business.services.common.generic.SalesManagerEntityService;
import com.salesmanager.core.model.catalog.product.ProductEnquiry;
import com.salesmanager.core.model.merchant.MerchantStore;

public interface ProductEnquiryService extends SalesManagerEntityService<Long, ProductEnquiry> {

	List<ProductEnquiry> listByStore(MerchantStore store);
}
