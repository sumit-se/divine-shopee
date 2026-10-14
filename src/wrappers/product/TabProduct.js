import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
import SectionTitle from "../../components/section-title/SectionTitle";
import ProductGrid from "./ProductGrid";
import WebService from '../../util/webService';
import constant from '../../util/constant';
import { setLoader } from "../../redux/actions/loaderActions";
import { multilanguage } from "redux-multilanguage";
import { connect } from "react-redux";
// divineshopee.com shows 12 here, in three rows of four.
const FEATURED_LIMIT = 12;

const TabProduct = ({
  setLoader,
  spaceTopClass,
  spaceBottomClass,
  category,
  containerClass,
  extraClass,
  defaultStore,
  currentLanguageCode
}) => {
  // const [featuredData, setFeaturedData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  useEffect(() => {
    getProductList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const getProductList = async () => {
    setLoader(true)
    // defaultStore arrives from redux via setMerchant(), which has not resolved
    // on first paint -- the request went out as 'store=' and returned nothing.
    // Fall back to the runtime config, loaded before the app boots.
    const storeCode = defaultStore || window._env_.APP_MERCHANT;
    let action = constant.ACTION.PRODUCT_GROUP + 'FEATURED_ITEM?store=' + storeCode + '&lang=' + currentLanguageCode;
    try {
      let response = await WebService.get(action);
      // console.log(response);
      if (response) {
        let category = [{ 'id': '', 'name': 'All', 'code': 'all', data: response.products }];
        response.products.forEach((item) => {
          if (item.categories !== null) {
            item.categories.forEach((a) => {
              // console.log(a)
              let index = category.findIndex(value => value.id === a.id);
              // console.log(index);
              if (index === -1) {
                category.push({ 'id': a.description.id, 'name': a.description.name, 'code': a.code, data: [item] })
              } else {
                category[index].data.push(item)
              }
            })
          }
        });
        // setFeaturedData(response.products)
        setCategoryData(category)
        setLoader(false)
      }
    } catch (error) {
      setLoader(false)
    }
  }
  // categoryData[0] is the 'All' bucket assembled above
  const featuredProducts = (categoryData[0] && categoryData[0].data) || [];

  return (
    <div
      className={`product-area ${spaceTopClass ? spaceTopClass : ""} ${
        spaceBottomClass ? spaceBottomClass : ""
        } ${extraClass ? extraClass : ""}`}
    >
      <div className={`${containerClass ? containerClass : "container"}`}>
        {/* matches the equivalent section heading on divineshopee.com */}
        <SectionTitle titleText="Our Top Selling Product" positionClass="text-center" />
        {/*
          A plain grid, as on divineshopee.com, which runs this section as 12
          products in a 4-wide grid with no filter control above it.

          The tab strip that used to sit here built one pill per category found
          among the featured products. That is 22 pills against this catalogue:
          they wrapped into five ragged rows ~160px deep between the heading and
          the products, each row centred independently, so nothing in the block
          shared an edge with anything else.
        */}
        <div className="row">
          <ProductGrid
            products={featuredProducts}
            type="men"
            limit={FEATURED_LIMIT}
            spaceBottomClass="mb-25"
          />
        </div>
      </div>
    </div>
  );
};

TabProduct.propTypes = {
  category: PropTypes.string,
  containerClass: PropTypes.string,
  extraClass: PropTypes.string,
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string,
  setLoader: PropTypes.func
};


const mapStateToProps = state => {
  return {
    currentLanguageCode: state.multilanguage.currentLanguageCode,
    defaultStore: state.merchantData.defaultStore
  };
};
const mapDispatchToProps = dispatch => {
  return {
    setLoader: (value) => {
      dispatch(setLoader(value));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(multilanguage(TabProduct));
// export default TabProductNine;
