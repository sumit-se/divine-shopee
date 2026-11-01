package com.salesmanager.test.catalog;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.fail;

import java.math.BigDecimal;
import java.sql.Date;

import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;

import org.junit.Test;
import org.springframework.data.domain.Page;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.services.catalog.product.variant.ProductVariantService;
import com.salesmanager.core.model.catalog.product.Product;
import com.salesmanager.core.model.catalog.product.availability.ProductAvailability;
import com.salesmanager.core.model.catalog.product.description.ProductDescription;
import com.salesmanager.core.model.catalog.product.price.ProductPrice;
import com.salesmanager.core.model.catalog.product.price.ProductPriceDescription;
import com.salesmanager.core.model.catalog.product.variant.ProductVariant;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.reference.language.Language;

/**
 * Reproduces: "Type specified for TypedQuery [java.lang.Long] is incompatible
 * with query return type [class ProductVariant]" on the pageable variant listing.
 *
 * Root cause: PageableProductVariantRepositoty.findByProductId countQuery uses
 * "select p from ProductVariant p ..." (returns entity) instead of
 * "select count(p) from ProductVariant p ..." (returns Long).
 */
public class ProductVariantPaginationTest extends com.salesmanager.test.common.AbstractSalesManagerCoreTestCase {

    @Inject
    private ProductVariantService productVariantService;

    @PersistenceContext
    private EntityManager em;

    @Test
    public void testVariantPaginationDoesNotThrow() throws ServiceException {

        Language en = languageService.getByCode("en");
        MerchantStore store = merchantService.getByCode(MerchantStore.DEFAULT_STORE);

        // Create a minimal product with one availability + price (required by saveProduct)
        Product product = new Product();
        product.setSku("TEST-VARIANT-PAG-001");
        product.setMerchantStore(store);
        product.setAvailable(true);
        product.setDateAvailable(new Date(System.currentTimeMillis()));

        ProductDescription desc = new ProductDescription();
        desc.setName("Variant Pagination Test Product");
        desc.setLanguage(en);
        desc.setProduct(product);
        product.getDescriptions().add(desc);

        ProductAvailability avail = new ProductAvailability();
        avail.setProductQuantity(10);
        avail.setProductStatus(true);
        avail.setRegion("*");
        avail.setMerchantStore(store);

        ProductPrice price = new ProductPrice();
        price.setDefaultPrice(true);
        price.setProductPriceAmount(new BigDecimal("99.00"));

        ProductPriceDescription priceDesc = new ProductPriceDescription();
        priceDesc.setLanguage(en);
        priceDesc.setName("Base price");
        priceDesc.setProductPrice(price);
        price.getDescriptions().add(priceDesc);

        price.setProductAvailability(avail);
        avail.getPrices().add(price);
        avail.setProduct(product);
        product.getAvailabilities().add(avail);

        productService.create(product);

        // Create one ProductVariant for the product
        ProductVariant variant = new ProductVariant();
        variant.setCode("VAR-TEST-001");
        variant.setSku("TEST-VARIANT-PAG-001-V1");
        variant.setProduct(product);
        variant.setAvailable(true);
        variant.setDefaultSelection(true);
        productVariantService.saveProductVariant(variant);

        // This call exercises the pageable countQuery — before the fix it throws:
        // InvalidDataAccessApiUsageException: Type specified for TypedQuery [java.lang.Long]
        // is incompatible with query return type [class ProductVariant]
        Page<ProductVariant> page = productVariantService.getByProductId(store, product, en, 0, 10);

        assertNotNull("Page result must not be null", page);
    }

    /**
     * Directly proves the broken countQuery type mismatch.
     *
     * The broken countQuery is:
     *   "select p from ProductVariant p join fetch p.product pr ..."
     * Spring Data JPA creates TypedQuery<Long> for count queries.
     * Asking Hibernate to execute an entity-returning JPQL as TypedQuery<Long>
     * throws IllegalArgumentException on MySQL (and strict Hibernate configs).
     *
     * This test reproduces the mismatch directly via EntityManager.
     */
    @Test
    public void testBrokenCountQueryTypeMismatch() {
        // This is what the broken countQuery does internally in Spring Data JPA:
        // em.createQuery(countJpql, Long.class) — but the JPQL returns ProductVariant
        String brokenCountJpql = "select p from ProductVariant p "
                + "join p.product pr "
                + "join pr.merchantStore prm "
                + "where pr.id = 1 and prm.id = 1";

        try {
            // Hibernate strictly validates: JPQL returns ProductVariant, not Long
            TypedQuery<Long> query = em.createQuery(brokenCountJpql, Long.class);
            query.getResultList(); // forces execution
            fail("Expected IllegalArgumentException due to TypedQuery<Long> vs ProductVariant return type mismatch");
        } catch (IllegalArgumentException e) {
            // This is the exact error production sees:
            // "Type specified for TypedQuery [java.lang.Long] is incompatible with
            //  query return type [class ProductVariant]"
            System.out.println("CONFIRMED BUG - broken countQuery throws: " + e.getMessage());
        }

        // The fix: select count(p) correctly returns Long
        String fixedCountJpql = "select count(p) from ProductVariant p "
                + "join p.product pr "
                + "join pr.merchantStore prm "
                + "where pr.id = 1 and prm.id = 1";

        TypedQuery<Long> fixedQuery = em.createQuery(fixedCountJpql, Long.class);
        Long count = fixedQuery.getSingleResult();
        assertNotNull("Fixed countQuery must execute and return a Long", count);
        System.out.println("CONFIRMED FIX - fixed countQuery returns count: " + count);
    }
}
