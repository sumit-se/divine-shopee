package com.salesmanager.core.business.repositories.payments;

import java.util.Date;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Temporal;
import org.springframework.data.repository.query.Param;

import com.salesmanager.core.model.payments.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

	@Query("select t from Transaction t join fetch t.order to where to.id = ?1")
	List<Transaction> findByOrder(Long orderId);
	
	/**
	 * Transactions whose details column holds this exact value.
	 *
	 * Every other query here joins on the order, so a transaction that has no
	 * order yet is invisible to them. An INIT transaction is written before the
	 * order exists -- that is the point of it -- so a gateway callback arriving
	 * with nothing but its own reference needs this to find anything at all.
	 *
	 * Returns a list rather than one row: details is not unique and nothing
	 * stops two gateways choosing the same reference.
	 *
	 * @param details exact details value, e.g. a Razorpay order or payment id
	 * @return matching transactions, order attached or not, oldest first
	 */
	@Query("select t from Transaction t where t.details = ?1 order by t.id asc")
	List<Transaction> findByDetails(String details);

	@Query("select t from Transaction t join fetch t.order to left join fetch to.orderAttributes toa left join fetch to.orderProducts too left join fetch to.orderTotal toot left join fetch to.orderHistory tood where to is not null and t.transactionDate BETWEEN :from AND :to")
	List<Transaction> findByDates(
			@Param("from") @Temporal(javax.persistence.TemporalType.TIMESTAMP) Date startDate, 
			@Param("to") @Temporal(javax.persistence.TemporalType.TIMESTAMP) Date endDate);
}
