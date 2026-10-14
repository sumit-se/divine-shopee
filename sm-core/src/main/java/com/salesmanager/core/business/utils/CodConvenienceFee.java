package com.salesmanager.core.business.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * The convenience fee charged for paying cash on delivery.
 *
 * Collecting cash at the door costs the store money -- the courier charges for
 * it and the cash has to be banked -- so the shopper who chooses it pays a fee:
 * a tenth of the order, but never less than a floor amount, because a tenth of
 * a small order does not cover the cost of collecting it.
 *
 * The rule lives here rather than in the places that use it, because four of
 * them need the same answer and any disagreement between them is money: the
 * total quoted at checkout, the total stored on the order, the ceiling the
 * payment module enforces, and the figure the storefront shows next to the
 * option. The storefront asks the server for the number rather than working it
 * out again in Javascript, for the same reason.
 *
 * "Order value" throughout means the order total before this fee is added --
 * products, shipping and tax. Measuring the fee or the ceiling against a total
 * that already includes the fee would be circular: the fee would push an order
 * over the ceiling that takes the fee away.
 */
public final class CodConvenienceFee {

	/** A tenth of the order. */
	public static final BigDecimal DEFAULT_PERCENT = new BigDecimal("10");

	/** ...but never less than this, whatever a tenth comes to. */
	public static final BigDecimal DEFAULT_MINIMUM = new BigDecimal("50");

	private CodConvenienceFee() {
	}

	/**
	 * The fee for an order of this value, under the store's default rule.
	 */
	public static BigDecimal calculate(BigDecimal orderValue) {
		return calculate(orderValue, DEFAULT_MINIMUM, DEFAULT_PERCENT);
	}

	/**
	 * The fee for an order of this value.
	 *
	 * @param orderValue the order total before the fee; null or negative yields zero
	 * @param minimum    the floor; null or negative means there is no floor
	 * @param percent    the percentage of the order value; null or negative means zero
	 */
	public static BigDecimal calculate(BigDecimal orderValue, BigDecimal minimum, BigDecimal percent) {
		if (orderValue == null || orderValue.compareTo(BigDecimal.ZERO) <= 0) {
			// nothing in the basket is not an order to charge a fee on
			return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
		}

		BigDecimal proportional = BigDecimal.ZERO;
		if (percent != null && percent.compareTo(BigDecimal.ZERO) > 0) {
			proportional = orderValue.multiply(percent)
					.divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
		}

		BigDecimal fee = proportional;
		if (minimum != null && minimum.compareTo(BigDecimal.ZERO) > 0 && minimum.compareTo(fee) > 0) {
			fee = minimum;
		}

		return fee.setScale(2, RoundingMode.HALF_UP);
	}

	/**
	 * The ceiling expressed as an amount payable rather than an order value.
	 *
	 * The payment module is handed the total the shopper will pay, which already
	 * has the fee in it, while the ceiling the store sets is an order value. The
	 * fee rises with the order, so "order value at or above the ceiling" is the
	 * same test as "payable at or above the ceiling plus the fee on the ceiling"
	 * -- this converts one into the other so the module can compare like with
	 * like instead of trying to subtract a fee it would have to infer.
	 */
	public static BigDecimal payableCeiling(BigDecimal orderValueCeiling) {
		if (orderValueCeiling == null || orderValueCeiling.compareTo(BigDecimal.ZERO) <= 0) {
			return orderValueCeiling;
		}
		return orderValueCeiling.add(calculate(orderValueCeiling)).setScale(2, RoundingMode.HALF_UP);
	}

}
