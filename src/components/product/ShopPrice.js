import PropTypes from "prop-types";
import React from "react";

/**
 * Price bands for the search results sidebar.
 *
 * Only the bands the current results actually fall into are listed, each with
 * its count, so the facet never offers a range that would empty the page. The
 * bands themselves are fixed rather than derived from the spread: a shopper
 * reads "Under 1,000" far quicker than a boundary computed from whatever
 * happened to match, and fixed edges stay put between one search and the next.
 *
 * Picking the band that is already on clears it, which is the same gesture the
 * category facet uses.
 */
const ShopPrice = ({ bands, activeBandId, getPriceParams, string }) => {
  if (!bands || bands.length === 0) return null;

  return (
    <div className="sidebar-widget mt-40">
      <h4 className="pro-sidebar-title">{(string && string["Price"]) || "Price"}</h4>
      <div className="sidebar-widget-list mt-20">
        <ul>
          {bands.map(band => (
            <li key={band.id}>
              <div>
                <button
                  type="button"
                  aria-pressed={activeBandId === band.id}
                  className={activeBandId === band.id ? "is-active" : ""}
                  onClick={() => getPriceParams(band.id)}
                >
                  {" "}{band.label}{" "}
                  <span className="sidebar-widget-count">({band.count})</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

ShopPrice.propTypes = {
  bands: PropTypes.array,
  activeBandId: PropTypes.string,
  getPriceParams: PropTypes.func,
  string: PropTypes.object
};

export default ShopPrice;
