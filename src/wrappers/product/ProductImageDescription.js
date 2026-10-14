import PropTypes from "prop-types";
import React, { useState } from "react";
import { connect } from "react-redux";
import { useToasts } from "react-toast-notifications";
// import { getDiscountPrice } from "../../helpers/product";
import ProductImageGallery from "../../components/product/ProductImageGallery";
import ProductDescriptionInfo from "../../components/product/ProductDescriptionInfo";

const ProductImageDescription = ({
  spaceTopClass,
  spaceBottomClass,
  galleryType,
  product,
  strings
  // currency,
  // cartItems,
  // wishlistItems,
  // compareItems
}) => {
  // const wishlistItem = wishlistItems.filter(
  //   wishlistItem => wishlistItem.id === product.id
  // )[0];
  // const compareItem = compareItems.filter(
  //   compareItem => compareItem.id === product.id
  // )[0];
  const { addToast } = useToasts();
  const finalProductPrice = product.originalPrice;
  const finalDiscountedPrice = product.finalPrice;
  /*
   * One gallery for the product and the chosen bead: the bead's own photos
   * first, marked as such, then the product's. A bead that is only the
   * store's default selection does not take the page over -- the gallery
   * opens on the product's main photo -- while a bead the shopper clicks
   * brings its own photo to the front.
   */
  const [variantImages, setVariantImages] = useState(null);
  const [pickedByShopper, setPickedByShopper] = useState(false);
  // the price on show, for the sale tag: the chosen bead's, else the product's
  const [shownPrice, setShownPrice] = useState(null);
  const onVariantChange = (variant, picked) => {
    setVariantImages(variant && variant.images && variant.images.length > 0 ? variant.images : null);
    setPickedByShopper(!!picked);
    const row = variant && (variant.inventory || []).find(r => r.prices && r.prices.length);
    const price = row ? row.prices[0] : null;
    setShownPrice(price
      ? { original: price.originalPrice, final: price.finalPrice, discounted: !!price.discounted }
      : null);
  };
  // no sale tag on a sold-out product: its price is "on request"
  const salePrice = product.soldOut ? null : (shownPrice
    || { original: product.originalPrice, final: product.finalPrice, discounted: !!product.discounted });
  const galleryImages = (() => {
    const own = (variantImages || []).map(image => ({ ...image, variantImage: true }));
    const seen = new Set(own.map(image => image.imageUrl));
    const rest = (product.images || []).filter(image => !seen.has(image.imageUrl));
    return own.concat(rest);
  })();
  // the shopper's bead opens first; otherwise the product's own main photo
  const galleryStart = pickedByShopper || !(product.images && product.images.length)
    ? 0
    : (variantImages ? variantImages.length : 0);

  return (
    <div
      className={`shop-area ${spaceTopClass ? spaceTopClass : ""} ${
        spaceBottomClass ? spaceBottomClass : ""
        }`}
    >
      <div className="container">
        <div className="row">
          <div className="col-lg-6 col-md-6">
            {/* product image gallery */}
            {/* {galleryType === "leftThumb" ? (
              <ProductImageGallerySideThumb
                product={product}
                thumbPosition="left"
              />
            ) : galleryType === "rightThumb" ? (
              <ProductImageGallerySideThumb product={product} />
            ) : galleryType === "fixedImage" ? (
              <ProductImageFixed product={product} />
            ) :
             ( */}
            <ProductImageGallery
              key={galleryImages.map(image => image.imageUrl).join("|") + ":" + galleryStart}
              product={product}
              images={galleryImages}
              startIndex={galleryStart}
              strings={strings}
              salePrice={salePrice}
            />
            {/* )} */}
          </div>
          <div className="col-lg-6 col-md-6">
            {/* product description info */}
            <ProductDescriptionInfo
              product={product}
              strings={strings}
              // discountedPrice={discountedPrice}
              // currency={currency}
              finalDiscountedPrice={finalDiscountedPrice}
              finalProductPrice={finalProductPrice}
              // cartItems={cartItems}
              // wishlistItem={wishlistItem}
              // compareItem={compareItem}
              addToast={addToast}
              onVariantChange={onVariantChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

ProductImageDescription.propTypes = {
  // cartItems: PropTypes.array,
  // compareItems: PropTypes.array,
  // currency: PropTypes.object,
  galleryType: PropTypes.string,
  product: PropTypes.object,
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string,
  // wishlistItems: PropTypes.array
};

const mapStateToProps = state => {
  return {
    // currency: state.currencyData,
    // cartItems: state.cartData,
    // wishlistItems: state.wishlistData,
    // compareItems: state.compareData
  };
};

export default connect(mapStateToProps)(ProductImageDescription);
