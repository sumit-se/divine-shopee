package com.salesmanager.shop.application.config;

import static com.salesmanager.core.business.constants.Constants.DEFAULT_STORE;

import java.util.Optional;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.shop.store.api.exception.UnauthorizedException;
import com.salesmanager.shop.store.controller.store.facade.StoreFacade;
import com.salesmanager.shop.store.controller.user.facade.UserFacade;

@Component
public class MerchantStoreArgumentResolver implements HandlerMethodArgumentResolver {

	private static final Logger LOGGER = LoggerFactory.getLogger(MerchantStoreArgumentResolver.class);
	public static final String REQUEST_PARAMATER_STORE = "store";

	/**
	 * Store used when a request carries no `store` parameter. Shopizer shipped
	 * this hard-wired to DEFAULT -- the demo store -- so any call that forgot the
	 * parameter silently answered for the wrong shop (the admin's brand dropdown
	 * did exactly that). Configurable through shopizer.store.default, set to
	 * divineStore for this deployment.
	 */
	/*
	 * Read from the Environment rather than through @Value: sm-core registers
	 * legacy PropertyPlaceholderConfigurer beans that resolve placeholders from
	 * their own .properties files, and they substituted the literal default here
	 * before Spring Boot's environment was consulted.
	 */
	@Autowired
	private org.springframework.core.env.Environment environment;

	@Autowired
	private StoreFacade storeFacade;

	@Autowired
	private UserFacade userFacade;

	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return parameter.getParameterType().equals(MerchantStore.class);
	}

	@Override
	public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
		String defaultStoreCode = environment.getProperty("shopizer.store.default", DEFAULT_STORE);
		String storeValue = Optional.ofNullable(webRequest.getParameter(REQUEST_PARAMATER_STORE))
				.filter(StringUtils::isNotBlank).orElse(defaultStoreCode);
		// todo get from cache
		MerchantStore storeModel = storeFacade.get(storeValue);

		HttpServletRequest httpServletRequest = webRequest.getNativeRequest(HttpServletRequest.class);

		// TODO Move to an api filter
		// authorize request
		boolean authorized = userFacade.authorizeStore(storeModel, httpServletRequest.getRequestURI());
		LOGGER.debug("is request authorized {} for {} and store {}", authorized, httpServletRequest.getRequestURI(),
				storeModel.getCode());
		if(!authorized){
			throw new UnauthorizedException("Cannot authorize user for store " + storeModel.getCode());
		}
		return storeModel;
	}
}
