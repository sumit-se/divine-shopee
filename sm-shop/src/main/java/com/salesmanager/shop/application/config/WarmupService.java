package com.salesmanager.shop.application.config;

import com.salesmanager.core.business.services.merchant.MerchantStoreService;
import com.salesmanager.core.business.services.reference.language.LanguageService;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.reference.language.Language;
import com.salesmanager.shop.store.controller.items.facade.ProductItemsFacade;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Warms up the @Cacheable("productGroups") cache immediately after Spring
 * finishes starting, so the first real user request is never a cold-DB hit.
 * Runs asynchronously so it never delays application startup.
 */
@Component
public class WarmupService {

    private static final Logger log = LoggerFactory.getLogger(WarmupService.class);

    @Autowired private ProductItemsFacade productItemsFacade;
    @Autowired private MerchantStoreService merchantStoreService;
    @Autowired private LanguageService languageService;

    @Value("${shopizer.store.default:divineStore}")
    private String defaultStore;

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void warmUpProductGroupCache() {
        try {
            MerchantStore store = merchantStoreService.getByCode(defaultStore);
            Language language = languageService.getByCode("en");
            if (store != null && language != null) {
                productItemsFacade.listItemsByGroup("FEATURED_ITEM", store, language);
                log.info("Warmup: productGroups cache populated for store={}", defaultStore);
            }
        } catch (Exception e) {
            log.warn("Warmup: productGroups cache failed (non-fatal): {}", e.getMessage());
        }
    }
}
