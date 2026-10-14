import PropTypes from "prop-types";
import React, { Fragment, useEffect, useState } from "react";
import MetaTags from "react-meta-tags";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import Layout from "../../layouts/Layout";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
// import RelatedProductSlider from "../../wrappers/product/RelatedProductSlider";
import ProductDescriptionTab from "../../wrappers/product/ProductDescriptionTab";
import ProductImageDescription from "../../wrappers/product/ProductImageDescription";
import WebService from '../../util/webService';
import constant from '../../util/constant';
import { productRedirect } from '../../util/redirects';
import { setLoader } from "../../redux/actions/loaderActions";
import { multilanguage } from "redux-multilanguage";
import { Link } from "react-router-dom";
const ProductDetails = ({ strings, location, productID, currentLanguageCode, setLoader, defaultStore }) => {
  const { pathname } = location;
  const [productDetails, setProductDetails] = useState();
  const [productReview, setProductReview] = useState([]);
  // the product could not be loaded: unknown address, or unlisted in the admin
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    // Reviews are keyed on the numeric id, so they can only be fetched once the
    // product has resolved -- a slug URL does not carry the id.
    const load = async () => {
      // an old address of a product whose slug was corrected: go to the
      // current one, replacing the history entry so Back does not bounce here
      const movedTo = productRedirect(productID);
      if (movedTo) {
        window.location.replace(process.env.PUBLIC_URL + "/product/" + movedTo + (location.search || ""));
        return;
      }
      const product = await getProductDetails();
      if (product && product.id) getReview(product.id);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getProductDetails = async () => {
    setLoader(true)
    // The route param may be a numeric id (/product/141) or an SEO slug
    // (/product/2-mukhi-rudraksha-full-seedwswyg). They are different
    // endpoints: /products/{id} takes a Long and rejects a slug, while
    // /product/friendly/{slug} resolves the SEF_URL.
    const isNumericId = /^\d+$/.test(String(productID || ''));
    const action = isNumericId
      ? constant.ACTION.PRODUCTS + productID + '?lang=' + currentLanguageCode + '&store=' + defaultStore
      : constant.ACTION.PRODUCT + 'friendly/' + encodeURIComponent(productID) +
          '?lang=' + currentLanguageCode + '&store=' + defaultStore;
    try {
      let response = await WebService.get(action);
      if (response) {
        setProductDetails(response)
        setLoader(false)
        return response;
      }
    } catch (error) {
      setLoader(false)
    }
    setUnavailable(true)
    return null;
  }
  const getReview = async (id) => {
    // API exposes /product/{id}/reviews (singular); PRODUCTS ('products/')
    // gave /products/{id}/reviews, which 404s.
    let action = constant.ACTION.PRODUCT + id + '/reviews?store=' + defaultStore;
    try {
      let response = await WebService.get(action);
      if (response) {
        setProductReview(response)
      }
    } catch (error) {
    }
  }
  return (
    <Fragment>
      <MetaTags>
        <title>{productDetails && productDetails.description.title}</title>
        <meta
          name="description"
          content={productDetails && productDetails.description.metaDescription}
        />
        {/* Open Graph, so the page previews properly when shared */}
        {productDetails && (
          <meta property="og:type" content="product" />
        )}
        {productDetails && (
          <meta property="og:title" content={productDetails.description.name} />
        )}
        {productDetails && productDetails.description.metaDescription && (
          <meta
            property="og:description"
            content={productDetails.description.metaDescription}
          />
        )}
        {productDetails && productDetails.image && productDetails.image.imageUrl && (
          <meta property="og:image" content={productDetails.image.imageUrl} />
        )}
        {/*
          Product structured data. This is what lets a search engine show the
          price and stock state in results; without it a product page is just
          prose to a crawler. Values come straight from the API -- `price` is
          the raw number, unlike originalPrice which is pre-formatted "\u20b9100.00".
        */}
        {productDetails && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: productDetails.description.name,
              sku: productDetails.sku,
              description: productDetails.description.metaDescription ||
                (productDetails.description.description || "").slice(0, 300),
              image: productDetails.image ? productDetails.image.imageUrl : undefined,
              offers: {
                "@type": "Offer",
                price: productDetails.price,
                priceCurrency: "INR",
                availability: productDetails.available && productDetails.quantity > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
                url: typeof window !== "undefined" ? window.location.href : undefined
              }
            })}
          </script>
        )}
      </MetaTags>

      <BreadcrumbsItem to={process.env.PUBLIC_URL + "/"}>{strings["Home"]}</BreadcrumbsItem>
      {/*
        The trail used to jump straight from Home to the product, so a shopper
        could not step back to the section they came from. The product carries
        its categories with their depth, so the path reads
        Home / Rudraksha / 17 Mukhi Rudraksha / this product.
      */}
      {/* a category the store has hidden is not a step in the trail: the page
          behind it is gone, so the crumb would be a dead link */}
      {productDetails && (productDetails.categories || [])
        .filter(category => category.visible !== false)
        .slice()
        .sort((a, b) => (a.depth || 0) - (b.depth || 0))
        .map(category => (
          <BreadcrumbsItem
            key={category.code}
            to={process.env.PUBLIC_URL + "/category/"
              + ((category.description && category.description.friendlyUrl) || category.code)}
          >
            {(category.description && category.description.name) || category.code}
          </BreadcrumbsItem>
        ))}
      <BreadcrumbsItem to={process.env.PUBLIC_URL + pathname}>
        {productDetails && productDetails.description.name}
      </BreadcrumbsItem>

      <Layout headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-2"
        headerTop="visible">
        {/* breadcrumb */}
        <Breadcrumb />

        {unavailable && !productDetails && (
          <div className="container pt-100 pb-100 text-center">
            <h3>{strings["This product is no longer available"] || "This product is no longer available"}</h3>
            <p className="mt-15">
              {strings["It may have been sold or removed from the store."] || "It may have been sold or removed from the store."}
            </p>
            <Link to={process.env.PUBLIC_URL + "/"} className="btn btn-dark mt-20">
              {strings["Continue Shopping"] || "Continue Shopping"}
            </Link>
          </div>
        )}

        {/* product description with image */}
        {
          productDetails &&
          <ProductImageDescription
            spaceTopClass="pt-100"
            spaceBottomClass="pb-100"
            strings={strings}
            product={productDetails}
          />
        }


        {/* product description tab */}
        {
          productDetails &&
          <ProductDescriptionTab
            spaceBottomClass="pb-90"
            strings={strings}
            product={productDetails}
            review={productReview}
          />
        }

        {/* related product slider */}
        {/* <RelatedProductSlider
          spaceBottomClass="pb-95"
          category={product.category[0]}
        /> */}
      </Layout>
    </Fragment>
  );
};

ProductDetails.propTypes = {
  location: PropTypes.object,
  // string when it comes from the route, number when it comes from redux
  productID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currentLanguageCode: PropTypes.string,
};

const mapStateToProps = (state, ownProps) => {
  // The product id must come from the URL first. Reading it only from redux
  // (set when a product card is clicked) meant a direct visit or a reload of
  // /product/:id had no id at all -- the fetch went to /api/v1/products/ and
  // the page rendered blank. That also made every PDP unshareable and
  // uncrawlable, which matters for a storefront built around SEO.
  const routeId =
    ownProps.match && ownProps.match.params ? ownProps.match.params.id : null;
  return {
    productID: routeId || state.productData.productid,
    currentLanguageCode: state.multilanguage.currentLanguageCode,
    // same first-paint race as the header: redux has not resolved the merchant
    // on a cold load, and an empty store= silently returns nothing.
    defaultStore: state.merchantData.defaultStore || window._env_.APP_MERCHANT
  };
};
const mapDispatchToProps = dispatch => {
  return {
    setLoader: (value) => {
      dispatch(setLoader(value));
    }
  };
};


export default connect(mapStateToProps, mapDispatchToProps)(multilanguage(ProductDetails));
