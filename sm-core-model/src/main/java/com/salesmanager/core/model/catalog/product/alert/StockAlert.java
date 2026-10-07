package com.salesmanager.core.model.catalog.product.alert;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.Table;
import javax.persistence.TableGenerator;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

/**
 * A shopper waiting for a sold-out product: "notify me when available".
 *
 * Kept at product level on purpose. Most beads are one of a kind, so the bead
 * that sold never comes back; the shopper is told when the product can be
 * bought again -- a new bead added, or any stock restored.
 *
 * Pending until NOTIFIED_AT is set (one message, then closed) or the shopper
 * unsubscribes (row removed) with the token sent in the message.
 */
@Entity
@Table(name = "STOCK_ALERT", indexes = {
		@Index(name = "STOCK_ALERT_PRODUCT_IDX", columnList = "PRODUCT_ID"),
		@Index(name = "STOCK_ALERT_TOKEN_IDX", columnList = "TOKEN", unique = true) })
public class StockAlert {

	@Id
	@Column(name = "STOCK_ALERT_ID")
	@TableGenerator(name = "TABLE_GEN", table = "SM_SEQUENCER", pkColumnName = "SEQ_NAME", valueColumnName = "SEQ_COUNT", pkColumnValue = "STOCK_ALERT_SEQ_NEXT_VAL")
	@GeneratedValue(strategy = GenerationType.TABLE, generator = "TABLE_GEN")
	private Long id;

	@Column(name = "MERCHANT_ID", nullable = false)
	private Integer merchantId;

	@Column(name = "PRODUCT_ID", nullable = false)
	private Long productId;

	@Column(name = "EMAIL", nullable = false, length = 100)
	private String email;

	/** optional, for WhatsApp once a provider is set up */
	@Column(name = "PHONE", length = 20)
	private String phone;

	/** the logged-in shopper, when there was one */
	@Column(name = "CUSTOMER_ID")
	private Long customerId;

	@Column(name = "LANGUAGE", length = 5)
	private String language;

	/** secret for the unsubscribe link */
	@Column(name = "TOKEN", nullable = false, length = 36)
	private String token;

	@Temporal(TemporalType.TIMESTAMP)
	@Column(name = "CREATED_AT", nullable = false)
	private Date createdAt;

	@Temporal(TemporalType.TIMESTAMP)
	@Column(name = "NOTIFIED_AT")
	private Date notifiedAt;

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public Integer getMerchantId() { return merchantId; }
	public void setMerchantId(Integer merchantId) { this.merchantId = merchantId; }
	public Long getProductId() { return productId; }
	public void setProductId(Long productId) { this.productId = productId; }
	public String getEmail() { return email; }
	public void setEmail(String email) { this.email = email; }
	public String getPhone() { return phone; }
	public void setPhone(String phone) { this.phone = phone; }
	public Long getCustomerId() { return customerId; }
	public void setCustomerId(Long customerId) { this.customerId = customerId; }
	public String getLanguage() { return language; }
	public void setLanguage(String language) { this.language = language; }
	public String getToken() { return token; }
	public void setToken(String token) { this.token = token; }
	public Date getCreatedAt() { return createdAt; }
	public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
	public Date getNotifiedAt() { return notifiedAt; }
	public void setNotifiedAt(Date notifiedAt) { this.notifiedAt = notifiedAt; }

}
