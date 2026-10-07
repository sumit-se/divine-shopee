package com.salesmanager.core.model.shipping;

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
import javax.persistence.UniqueConstraint;

import com.salesmanager.core.model.common.audit.AuditListener;
import com.salesmanager.core.model.common.audit.AuditSection;
import com.salesmanager.core.model.common.audit.Auditable;
import com.salesmanager.core.model.generic.SalesManagerEntity;
import com.salesmanager.core.model.merchant.MerchantStore;

/**
 * A postal code the store will not send cash on delivery to.
 *
 * One row per postcode per store. A row that is not active is kept for the
 * record but no longer blocks anything, which is easier to work with than
 * deleting and re-adding a code.
 */
@Entity
@EntityListeners(value = AuditListener.class)
@Table(name = "COD_RESTRICTED_POSTAL_CODE",
    uniqueConstraints = @UniqueConstraint(columnNames = {"MERCHANT_ID", "POSTAL_CODE"}))
public class CodRestrictedPostalCode extends SalesManagerEntity<Long, CodRestrictedPostalCode>
    implements Serializable, Auditable {

  private static final long serialVersionUID = 1L;

  @Id
  @Column(name = "COD_RESTRICTED_POSTAL_CODE_ID")
  @TableGenerator(name = "TABLE_GEN", table = "SM_SEQUENCER", pkColumnName = "SEQ_NAME",
      valueColumnName = "SEQ_COUNT", pkColumnValue = "COD_RESTRICTED_POSTAL_CODE_SEQ_NEXT_VAL")
  @GeneratedValue(strategy = GenerationType.TABLE, generator = "TABLE_GEN")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "MERCHANT_ID", nullable = false)
  private MerchantStore merchantStore;

  /** Stored as entered minus spaces and case, so "201 301" and "201301" match. */
  @Column(name = "POSTAL_CODE", nullable = false, length = 20)
  private String postalCode;

  /** ISO country code, for stores that ship to more than one country. */
  @Column(name = "COUNTRY_CODE", nullable = true, length = 2)
  private String countryCode;

  @Column(name = "ACTIVE", nullable = false)
  private boolean active = true;

  /** Why, for whoever reads the list a year from now. */
  @Column(name = "REASON", nullable = true, length = 255)
  private String reason;

  @Embedded
  private AuditSection auditSection = new AuditSection();

  public CodRestrictedPostalCode() {
  }

  public CodRestrictedPostalCode(MerchantStore merchantStore, String postalCode) {
    this.merchantStore = merchantStore;
    this.postalCode = postalCode;
  }

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

  public String getPostalCode() {
    return postalCode;
  }

  public void setPostalCode(String postalCode) {
    this.postalCode = postalCode;
  }

  public String getCountryCode() {
    return countryCode;
  }

  public void setCountryCode(String countryCode) {
    this.countryCode = countryCode;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
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
