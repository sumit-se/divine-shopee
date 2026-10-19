import PropTypes from "prop-types";
import React from "react";
// import {
//   getIndividualCategories,
//   getIndividualTags,
//   getIndividualColors,
//   getProductsIndividualSizes
// } from "../../helpers/product";
// import ShopSearch from "../../components/product/ShopSearch";
import ShopCategories from "../../components/product/ShopCategories";
import ShopPrice from "../../components/product/ShopPrice";
import ShopColor from "../../components/product/ShopColor";
import ShopSize from "../../components/product/ShopSize";
// import ShopTag from "../../components/product/ShopTag";
import ShopManufacture from "../../components/product/ShopManufacture";

// activeCategoryId is optional: the search page passes it so the chosen
// facet can show as selected, the category page leaves it off because there
// the same list navigates rather than filters.
const ShopSidebar = ({ string, getCategoryParams, getSortParams, sideSpaceClass, uniqueCategories, activeCategoryId, priceBands, activePriceBandId, getPriceParams, uniqueColors, uniqueSizes, uniqueManufacture, hasActiveFilters, clearFilters }) => {
  return (
    <div className={`sidebar-style ${sideSpaceClass ? sideSpaceClass : ""}`}>
      {hasActiveFilters && (
        <button type="button" className="clear-filter-btn" onClick={clearFilters}>
          {(string && string["Clear Filter"]) || "Clear Filter"} ×
        </button>
      )}

      {/* shop search */}
      {/* <ShopSearch strings={strings} /> */}

      {/* filter by categories */}
      {
        uniqueCategories.length > 0 &&
        <ShopCategories string={string} categories={uniqueCategories} getCategoryParams={getCategoryParams} activeCategoryId={activeCategoryId} />
      }

      {/* filter by price band -- search page only; it renders nothing when no
          bands are passed, which is how the category page leaves it out */}
      <ShopPrice string={string} bands={priceBands} activeBandId={activePriceBandId} getPriceParams={getPriceParams} />


      {/* filter by manufacture */}
      {
        uniqueManufacture.length > 0 &&
        <ShopManufacture string={string} manufactures={uniqueManufacture} getSortParams={getSortParams} />
      }


      {/* filter by color */}
      {
        uniqueColors.length > 0 &&
        <ShopColor string={string} colors={uniqueColors} getSortParams={getSortParams} />
      }


      {/* filter by size */}
      {
        uniqueSizes.length > 0 &&
        <ShopSize string={string} sizes={uniqueSizes} getSortParams={getSortParams} />
      }


      {/* filter by tag */}
      {/* <ShopTag tags={uniqueTags} getSortParams={getSortParams} /> */}
    </div>
  );
};

ShopSidebar.propTypes = {
  getSortParams: PropTypes.func,
  products: PropTypes.array,
  sideSpaceClass: PropTypes.string
};

export default ShopSidebar;
