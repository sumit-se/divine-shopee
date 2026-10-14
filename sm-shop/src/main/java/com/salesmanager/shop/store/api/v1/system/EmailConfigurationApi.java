package com.salesmanager.shop.store.api.v1.system;

import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.inject.Inject;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.salesmanager.core.business.modules.email.EmailConfig;
import com.salesmanager.core.business.services.system.EmailService;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.shop.constants.Constants;
import com.salesmanager.shop.store.api.exception.ServiceRuntimeException;
import com.salesmanager.shop.utils.AuthorizationUtils;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import springfox.documentation.annotations.ApiIgnore;

/**
 * The store's outgoing mail settings, held in the database rather than in a
 * properties file on the server.
 *
 * Shopizer has always preferred a stored configuration -- DefaultEmailSenderImpl
 * takes protocol, host, port, credentials, auth and starttls from it whenever
 * one exists, and only falls back to email.properties when it does not -- but
 * nothing exposed it, so the only way to set it was to write the row by hand.
 * This is that missing surface.
 *
 * The password is write-only. It is accepted on save and never returned by the
 * read, because an admin screen has no use for it and an API that hands back
 * credentials turns every stray log, proxy cache and browser history entry into
 * somewhere the SMTP password now lives. Saving without one keeps the stored
 * password, so editing the host does not silently wipe it.
 */
@RestController
@RequestMapping("/api/v1")
@Api(tags = { "Email configuration resource (Email Configuration Api)" })
public class EmailConfigurationApi {

	private static final Logger LOGGER = LoggerFactory.getLogger(EmailConfigurationApi.class);

	@Inject
	private EmailService emailService;

	@Inject
	private AuthorizationUtils authorizationUtils;

	private void authorize(MerchantStore merchantStore) {
		String user = authorizationUtils.authenticatedUser();
		authorizationUtils.authorizeUser(user,
				Stream.of(Constants.GROUP_SUPERADMIN, Constants.GROUP_ADMIN).collect(Collectors.toList()),
				merchantStore);
	}

	@GetMapping("/private/configurations/email")
	@ApiOperation(httpMethod = "GET", value = "Get the store's email configuration", notes = "The password is never returned", response = EmailConfig.class)
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT") })
	@ResponseBody
	public EmailConfig get(@ApiIgnore MerchantStore merchantStore) {
		authorize(merchantStore);
		try {
			EmailConfig config = emailService.getEmailConfiguration(merchantStore);
			if (config == null) {
				// nothing stored yet: an empty shape, so the screen has fields
				// to fill rather than nulls to guard against
				return new EmailConfig();
			}
			config.setPassword(null);
			return config;
		} catch (Exception e) {
			throw new ServiceRuntimeException("Could not read the email configuration", e);
		}
	}

	@PostMapping("/private/configurations/email")
	@ResponseStatus(HttpStatus.OK)
	@ApiOperation(httpMethod = "POST", value = "Save the store's email configuration", notes = "Omit the password to keep the stored one")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT") })
	public void save(@RequestBody EmailConfig config, @ApiIgnore MerchantStore merchantStore) {
		authorize(merchantStore);
		try {
			if (StringUtils.isBlank(config.getPassword())) {
				EmailConfig existing = emailService.getEmailConfiguration(merchantStore);
				if (existing != null) {
					config.setPassword(existing.getPassword());
				}
			}
			emailService.saveEmailConfiguration(config, merchantStore);
			// host and port only: the rest of what was just saved is a credential
			LOGGER.info("Email configuration saved for store [{}] -> {}:{}", merchantStore.getCode(),
					config.getHost(), config.getPort());
		} catch (Exception e) {
			throw new ServiceRuntimeException("Could not save the email configuration", e);
		}
	}

}
