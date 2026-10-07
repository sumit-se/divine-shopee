package com.salesmanager.core.model.catalog.product;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.TableGenerator;

import org.hibernate.annotations.Type;

import com.salesmanager.core.model.common.audit.AuditListener;
import com.salesmanager.core.model.common.audit.AuditSection;
import com.salesmanager.core.model.common.audit.Auditable;
import com.salesmanager.core.model.generic.SalesManagerEntity;
import com.salesmanager.core.model.merchant.MerchantStore;

/**
 * Someone asking about a product the store does not sell over the counter.
 *
 * Kept as a row rather than only an email: the notification can fail -- a bad
 * smtp password, a mailbox down -- and an enquiry is a customer waiting for an
 * answer, not a log line.
 */
@Entity
@EntityListeners(value = AuditListener.class)
@Table(name = "PRODUCT_ENQUIRY")
public class ProductEnquiry extends SalesManagerEntity<Long, ProductEnquiry>
    implements Serializable, Auditable {

  private static final long serialVersionUID = 1L;

  @Id
  @Column(name = "PRODUCT_ENQUIRY_ID")
  @TableGenerator(name = "TABLE_GEN", table = "SM_SEQUENCER", pkColumnName = "SEQ_NAME",
      valueColumnName = "SEQ_COUNT", pkColumnValue = "PRODUCT_ENQUIRY_SEQ_NEXT_VAL")
  @GeneratedValue(strategy = GenerationType.TABLE, generator = "TABLE_GEN")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "MERCHANT_ID", nullable = false)
  private MerchantStore merchantStore;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "PRODUCT_ID", nullable = true)
  private Product product;

  /** Kept beside the product so the enquiry still reads on its own later. */
  @Column(name = "PRODUCT_SKU", length = 100)
  private String productSku;

  @Column(name = "PRODUCT_NAME", length = 255)
  private String productName;

  @Column(name = "CUSTOMER_NAME", nullable = false, length = 100)
  private String customerName;

  @Column(name = "CUSTOMER_EMAIL", nullable = false, length = 100)
  private String customerEmail;

  @Column(name = "CUSTOMER_PHONE", length = 32)
  private String customerPhone;

  @Column(name = "MESSAGE")
  @Type(type = "org.hibernate.type.TextType")
  private String message;

  /** NEW until someone has dealt with it. */
  @Column(name = "STATUS", length = 20)
  private String status = "NEW";

  @Embedded
  private AuditSection auditSection = new AuditSection();

  @Override
  public Long getId() {
    return id;
  }

  @Override
  public void setId(Long id) {
    this.id = id;
  }

  public MerchantStore getMerchantStore() {
    return merchantStore;
  }

  public void setMerchantStore(MerchantStore merchantStore) {
    this.merchantStore = merchantStore;
  }

  public Product getProduct() {
    return product;
  }

  public void setProduct(Product product) {
    this.product = product;
  }

  public String getProductSku() {
    return productSku;
  }

  public void setProductSku(String productSku) {
    this.productSku = productSku;
  }

  public String getProductName() {
    return productName;
  }

  public void setProductName(String productName) {
    this.productName = productName;
  }

  public String getCustomerName() {
    return customerName;
  }

  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  public String getCustomerEmail() {
    return customerEmail;
  }

  public void setCustomerEmail(String customerEmail) {
    this.customerEmail = customerEmail;
  }

  public String getCustomerPhone() {
    return customerPhone;
  }

  public void setCustomerPhone(String customerPhone) {
    this.customerPhone = customerPhone;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  @Override
  public AuditSection getAuditSection() {
    return auditSection;
  }

  @Override
  public void setAuditSection(AuditSection auditSection) {
    this.auditSection = auditSection;
  }
}
