import PropTypes from "prop-types";
import React from "react";

// "₹39,100.00" -> 39100; the API sends prices formatted
const amount = (price) => Number(String(price || "").replace(/[^0-9.]/g, "")) || 0;

/**
 * The saving, in whole percent, when a price is discounted -- by a special
 * price or a promotion window, which is how the store runs a sale -- or null.
 */
export const saleInfo = (original, final, discounted) => {
  const was = amount(original);
  const now = amount(final);
  if (!discounted || !was || !now || now >= was) return null;
  return { percent: Math.round(((was - now) / was) * 100) };
};

/**
 * "SALE / 18% OFF" in the top corner of a product's image. Shown on the product
 * cards in listings and on the product page, whenever the price on show is
 * discounted. Nothing renders when it is not.
 */
const SaleTag = ({ original, final, discounted, strings }) => {
  const sale = saleInfo(original, final, discounted);
  if (!sale) return null;
  return (
    <span className="sale-tag">
      <span className="sale-tag__label">{(strings && strings["Sale"]) || "Sale"}</span>
      {sale.percent > 0 && (
        <span className="sale-tag__off">{sale.percent}% {(strings && strings["OFF"]) || "OFF"}</span>
      )}
    </span>
  );
};

SaleTag.propTypes = {
  original: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  final: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  discounted: PropTypes.bool,
  strings: PropTypes.object
};

export default SaleTag;
