package com.salesmanager.core.business.services.system;

import javax.inject.Inject;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.salesmanager.core.business.constants.Constants;
import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.modules.email.Email;
import com.salesmanager.core.business.modules.email.EmailConfig;
import com.salesmanager.core.business.modules.email.HtmlEmailSender;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.system.MerchantConfiguration;
import com.salesmanager.core.modules.utils.Encryption;

import org.apache.commons.lang3.StringUtils;

@Service("emailService")
public class EmailServiceImpl implements EmailService {

	@Inject
	private MerchantConfigurationService merchantConfigurationService;
	
	@Inject
	private HtmlEmailSender sender;

	/*
	 * The row holds an SMTP password, so it is encrypted at rest the same way
	 * the payment modules are (PaymentServiceImpl) and with the same key.
	 * MerchantConfiguration stores its value as a plain column -- nothing
	 * encrypts it on the way through -- so without this the password would sit
	 * readable in the database and in every dump taken from it.
	 */
	@Inject
	private Encryption encryption;
	
	@Override
	public void sendHtmlEmail(MerchantStore store, Email email) throws ServiceException, Exception {

		EmailConfig emailConfig = getEmailConfiguration(store);
		
		sender.setEmailConfig(emailConfig);
		sender.send(email);
	}

	@Override
	public EmailConfig getEmailConfiguration(MerchantStore store) throws ServiceException {
		
		MerchantConfiguration configuration = merchantConfigurationService.getMerchantConfiguration(Constants.EMAIL_CONFIG, store);
		EmailConfig emailConfig = null;
		if(configuration!=null && !StringUtils.isBlank(configuration.getValue())) {
			String value = decryptConfiguration(configuration.getValue());

			ObjectMapper mapper = new ObjectMapper();
			try {
				emailConfig = mapper.readValue(value, EmailConfig.class);
			} catch(Exception e) {
				/*
				 * Deliberately not echoing the value: it is the decrypted
				 * configuration and carries the SMTP password, which would then
				 * be in the log and in whatever collects it.
				 */
				throw new ServiceException("Cannot parse the stored email configuration", e);
			}
		}
		return emailConfig;
	}
	
	
	@Override
	public void saveEmailConfiguration(EmailConfig emailConfig, MerchantStore store) throws ServiceException {
		MerchantConfiguration configuration = merchantConfigurationService.getMerchantConfiguration(Constants.EMAIL_CONFIG, store);
		if(configuration==null) {
			configuration = new MerchantConfiguration();
			configuration.setMerchantStore(store);
			configuration.setKey(Constants.EMAIL_CONFIG);
		}
		
		/*
		 * Fail the save rather than fall back to storing it in the clear: a
		 * silently unencrypted row would look no different in the database and
		 * nothing would ever flag it.
		 */
		try {
			configuration.setValue(encryption.encrypt(emailConfig.toJSONString()));
		} catch(Exception e) {
			throw new ServiceException("Cannot encrypt the email configuration", e);
		}
		merchantConfigurationService.saveOrUpdate(configuration);
	}

	/**
	 * The stored configuration, decrypted.
	 *
	 * A row written before this was encrypted is still plain JSON, and
	 * decrypting it throws rather than returning something useful. Falling back
	 * to reading it as-is means an existing install keeps working and quietly
	 * upgrades the next time the configuration is saved, instead of every email
	 * failing until someone re-enters the settings.
	 */
	private String decryptConfiguration(String value) {
		try {
			String decrypted = encryption.decrypt(value);
			if(!StringUtils.isBlank(decrypted)) {
				return decrypted;
			}
		} catch(Exception e) {
			// not encrypted, or not with this key -- fall through to the raw value
		}
		return value;
	}

}
