import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { multilanguage } from "redux-multilanguage";
import { connect } from "react-redux";
import Logo from "../../components/header/Logo";
import NavMenu from "../../components/header/NavMenu";
import IconGroup from "../../components/header/IconGroup";
import MobileMenu from "../../components/header/MobileMenu";
import HeaderSearch from "../../components/header/sub-components/HeaderSearch";
import WebService from '../../util/webService';
import constant from '../../util/constant';
// import { setLocalData } from '../../util/helper';
import { setMerchant } from "../../redux/actions/storeAction";
import { getCurrentLocation } from "../../redux/actions/userAction";
import { visibleCategories } from "../../helpers/category";
import { fetchCategoryTree } from "../../util/categoryTree";
const Header = ({
  setMerchant,
  merchant,
  layout,
  top,
  borderStyle,
  headerPaddingClass,
  headerPositionClass,
  headerBgClass,
  defaultStore,
  getCurrentLocation,
  currentLanguageCode
}) => {
  const history = useHistory();
  const [scroll, setScroll] = useState(0);
  const [headerTop, setHeaderTop] = useState(0);
  const [categoryData, setCategoryData] = useState([]);
  const [contentData, setContentData] = useState([]);

  useEffect(() => {
    checkServerHealth();

    const header = document.querySelector(".sticky-bar");
    setHeaderTop(header.offsetTop);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const checkServerHealth = async () => {

    // let action = 'actuator/health/ping';
    try {
      // console.log("*********************************");
      // console.log("BASE URL " + window._env_.APP_BASE_URL);
      // console.log("APP_API_VERSION " + window._env_.APP_API_VERSION);
      // console.log("APP_MERCHANT " + window._env_.APP_MERCHANT);
      // console.log("*********************************");
      let response = await WebService.get(window._env_.APP_BASE_URL + '/actuator/health/ping');

      if (response) {
        // console.log(response)
        if (response.status === 'UP') {
          setMerchant()
          getCurrentLocation();
          getCategoryHierarchy();
          getContent();
        } else {
          history.push('/not-found')
        }
      }
    } catch (error) {
      history.push('/not-found')
    }


  }
  const getCategoryHierarchy = async () => {
    // 'count' caps TOTAL nodes returned (roots + children), not root categories.
    // At the original count=20 the API silently dropped a whole root category
    // and 8 Rudraksha sub-categories, so the nav rendered an incomplete tree.
    // 31 categories exist today; 200 leaves headroom without paging the menu.
    //
    // defaultStore comes from redux via setMerchant(), which is dispatched
    // immediately above this call -- so on first paint it is still empty and the
    // request went out as 'store=', returning nothing. Fall back to the runtime
    // config, which is loaded by public/env-config.js before the app boots.
    const storeCode = defaultStore || window._env_.APP_MERCHANT;
    try {
      let response = await fetchCategoryTree(storeCode, currentLanguageCode);
      if (response) {
        // the API returns hidden categories too, flagged rather than omitted
        setCategoryData(visibleCategories(response.categories));
      }
    } catch (error) {
      // console.log(error.messages)
      // console.log(error)
      // history.push('/not-found')
    }


  }
  const getContent = async () => {
    //TODO PAGE + COUNT
    // same first-paint race as getCategoryHierarchy above
    const storeCode = defaultStore || window._env_.APP_MERCHANT;
    let action = constant.ACTION.CONTENT + constant.ACTION.PAGES + '?page=0&count=20&store=' + storeCode + '&lang=' + currentLanguageCode;
    try {
      let response = await WebService.get(action);
      if (response) {
        setContentData(response.items)
      }
    } catch (error) {
    }
  }
  const handleScroll = () => {
    setScroll(window.scrollY);
  };

  return (
    <header
      className={`header-area clearfix ${headerBgClass ? headerBgClass : ""} ${headerPositionClass ? headerPositionClass : ""}`}>
      {/* The language/phone strip that used to sit here has been removed --
          the previous site opens straight into the logo + search row. */}
      <div
        className={`${
          headerPaddingClass ? headerPaddingClass : ""
          } sticky-bar header-res-padding clearfix ${
          scroll > headerTop ? "stick" : ""
          }`}
      >
        {/* Two-row header, matching the previous site: a white row carrying the
            logo and account/cart icons, then a full-width saffron band holding
            the navigation. The theme originally packed all three into a single
            row, which left the nav band as a floating block that wrapped. */}
        {/* Always `container`, never the `container-fluid` every page passes in:
            the header has to sit on the same grid as the sections below it,
            and .container carries Bootstrap's responsive widths so the two
            stay locked together at every breakpoint. The saffron strip keeps
            its full-bleed colour from .brand-nav-band, outside this element. */}
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-3 col-lg-3 col-md-6 col-6">
              {/* header logo */}
              {
                merchant.logo != null && <Logo imageUrl={merchant.logo.path} logoClass="logo" />
              }

            </div>
            <div className="col-xl-6 col-lg-6 d-none d-lg-block">
              {/* centred product search, as on the previous site */}
              <HeaderSearch />
            </div>
            <div className="col-xl-3 col-lg-3 col-md-6 col-6">
              {/* Icon group */}
              <IconGroup />
            </div>
          </div>
          {/*
            The same search again, on its own row, for the widths where the
            column above is d-none. Below lg the header had no search at all:
            the field was in the DOM and hidden, and MobileSearch -- the stub
            the theme ships -- has action="#", no state and no navigation, so
            a phone could not search the shop at all. One row rather than an
            icon that expands, because the field is its own affordance and
            there is room for it under the logo.
          */}
          <div className="row d-lg-none">
            <div className="col-12 pb-3">
              <HeaderSearch />
            </div>
          </div>
        </div>
        <div className="brand-nav-band d-none d-lg-block">
          <div className="container">
            {/* Nav menu */}
            <NavMenu categories={categoryData} contents={contentData} />
          </div>
        </div>
        {/* mobile menu */}
        <MobileMenu categories={categoryData} contents={contentData} />
      </div>
    </header>
  );
};

Header.propTypes = {
  // merchant: PropTypes.string,
  borderStyle: PropTypes.string,
  headerPaddingClass: PropTypes.string,
  headerPositionClass: PropTypes.string,
  layout: PropTypes.string,
  top: PropTypes.string,
  setMerchant: PropTypes.func
};

const mapStateToProps = state => {
  return {
    merchant: state.merchantData.merchant,
    currentLanguageCode: state.multilanguage.currentLanguageCode,
    defaultStore: state.merchantData.defaultStore
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setMerchant: () => {
      dispatch(setMerchant());
    },
    getCurrentLocation: () => {
      dispatch(getCurrentLocation())
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(multilanguage(Header));

// export default HeaderOne;
