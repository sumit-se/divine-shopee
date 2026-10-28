import PropTypes from "prop-types";
import ProductDescription from "./ProductDescription";
import React, { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
// import { getProductCartQuantity } from "../../helpers/product";
import { isValidObject } from "../../util/helper";
import { addToCart } from "../../redux/actions/cartActions";
// import { addToWishlist } from "../../redux/actions/wishlistActions";
// import { addToCompare } from "../../redux/actions/compareActions";
// import Rating from "./sub-components/ProductRating";
import StarRatings from 'react-star-ratings';
import WebService from '../../util/webService';
import constant from '../../util/constant';
import { setLoader } from "../../redux/actions/loaderActions";
import NotifyWhenAvailable from "./NotifyWhenAvailable";

// the Special category (promotional offers): see isSpecialOffer below
const SPECIAL_CATEGORY_CODE = "special";
const SPECIAL_MAX_QUANTITY = 10;

const ProductDescriptionInfo = ({
  product,
  // currency,
  finalDiscountedPrice,
  finalProductPrice,
  cartItems,
  // wishlistItem,
  // compareItem,
  addToast,
  addToCart,
  setLoader,
  productID,
  defaultStore,
  userData,
  strings,
  onVariantChange,
  currentLanguageCode
  // addToWishlist,
  // addToCompare
}) => {
  const [discountedPrice, setDiscountedPrice] = useState(finalDiscountedPrice)
  const [productPrice, setProductPrice] = useState(finalProductPrice)
  const [isDiscount, setIsDiscount] = useState(product.discounted)
  const [selectedProductColor, setSelectedProductColor] = useState([])
  const [quantityCount, setQuantityCount] = useState(1);
  // false while the choice is still the store's default selection
  const [pickedByShopper, setPickedByShopper] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquirySending, setEnquirySending] = useState(false);
  const [enquiry, setEnquiry] = useState({ name: "", email: "", phone: "", message: "" });
  useEffect(() => {
    // console.log(strings);
    getDefualtsOption()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDefualtsOption = async () => {
    let temp = [];
    if (product.options) {
      product.options.map(async (item) => {
        item.optionValues.map(async (data) => {
          if (data.defaultValue) {
            temp.push({ 'name': item.name, 'id': data.id });
          }
        })
      })
      setSelectedProductColor(temp)
    }
  }


  // Which value of this option is currently chosen, in the exact JSON the
  // <option> elements carry, so the select stays a controlled component.
  const selectedValueFor = (option) => {
    const picked = selectedProductColor.find(a => a.name === option.name);
    if (!picked) return "";
    const match = (option.optionValues || []).find(v => v.id === picked.id);
    return match ? JSON.stringify(match) : "";
  };

  const onChangeOptions = async (value, option) => {
    setPickedByShopper(true);

    let tempSelectedOptions = [];
    let index;
    if (option.type === 'radio' || option.type === 'select') {
      index = selectedProductColor.findIndex(a => a.name === option.name);
    } else {
      index = selectedProductColor.findIndex(a => a.id === value.id);
    }

    if (index === -1) {
      let temp = [...selectedProductColor, { 'name': option.name, 'id': value.id }]
      tempSelectedOptions = temp;
      setSelectedProductColor(temp)
      // setSelectedProductColor([...selectedProductColor, { 'name': option.name, 'id': value.id }])
    } else {
      let temp = [...selectedProductColor]
      if (option.type === 'radio' || option.type === 'select') {
        temp[index] = { 'name': option.name, 'id': value.id };

      } else {
        temp.splice(index, 1);
      }
      tempSelectedOptions = temp;
      setSelectedProductColor(temp)
    }
  }
  /*
   * There was a getPrice() here that POSTed the chosen options to
   * /product/{id}/price on every option change and once on mount. That route
   * is commented out in the API -- it 404'd every time -- so the prices on
   * screen have always come from the product payload and, for a bead, from
   * the variant's own pricing just below. The call was costing a category page
   * fifteen failed requests and fifteen CORS preflights, one pair per card,
   * and this catalogue has no attribute-level price deltas for it to compute
   * anyway (PRODUCT_ATTRIBUTE is empty).
   */

  // A parent product is one the shopper buys through a choice: it carries
  // selectable options, and the real SKU and stock sit on the variant behind
  // the option, not on this record. So the parent's own SKU is not shown, and
  // its own quantity does not decide whether it can be added to the cart --
  // a parent with 0 on its own row is normal, not sold out.
  const isParent = (product.options || []).some(
    option => (option.optionValues || []).length > 0
  );

  /*
   * Some products are shown but not sold: their product type has "allow add to
   * cart" switched off in the admin, and the shopper sends an enquiry instead.
   * The API says so twice -- the type's own flag and canBePurchased -- and it
   * refuses such a line if anything tries to add it anyway.
   */
  const enquiryOnly = !!(product.type && product.type.allowAddToCart === false);

  const canAddToCart =
    !enquiryOnly &&
    product.available &&
    product.visible &&
    (isParent || (product.canBePurchased && product.quantity > 0));

  // Stock of one variant: its inventory rows are per region, and the shopper
  // can only be sold what the smallest of them holds.
  const variantStock = (variant) => {
    const rows = (variant && variant.inventory) || [];
    if (rows.length === 0) return 0;
    return rows.reduce(
      (least, row) => Math.min(least, Number(row.quantity) || 0),
      Number.MAX_SAFE_INTEGER
    );
  };

  /** Send an enquiry about a product the store does not sell directly. */
  const submitEnquiry = async (event) => {
    event.preventDefault();
    if (!enquiry.name.trim() || !enquiry.email.trim()) {
      addToast(strings["Please give your name and email"] || "Please give your name and email",
        { appearance: "error", autoDismiss: true });
      return;
    }
    setEnquirySending(true);
    try {
      await WebService.post(
        constant.ACTION.PRODUCT + product.sku + '/enquiry?store=' + window._env_.APP_MERCHANT,
        enquiry);
      setEnquiry({ name: "", email: "", phone: "", message: "" });
      setEnquiryOpen(false);
      addToast(strings["Thank you, we have your enquiry and will be in touch"]
        || "Thank you, we have your enquiry and will be in touch",
        { appearance: "success", autoDismiss: true });
    } catch (error) {
      const message = error && error.response && error.response.data && error.response.data.message;
      addToast(message || (strings["Your enquiry could not be sent"] || "Your enquiry could not be sent"),
        { appearance: "error", autoDismiss: true });
    }
    setEnquirySending(false);
  };

  // Option values built from variants carry the variant's own id, so a chosen
  // value points straight at the variant behind it.
  const selectedVariant = (product.variants || []).find(variant =>
    selectedProductColor.some(chosen => chosen.id === variant.id)
  );

  // tell the page which variant is chosen, and whether the shopper chose it,
  // so the gallery can add its images and decide which photo to open on
  const selectedVariantId = selectedVariant ? selectedVariant.id : null;
  // (read once it is known; a sold-out page shows no "Your bead": there is
  // no bead left to buy, so the gallery keeps to the product's own photos)
  const soldOutRef = React.useRef(false);
  useEffect(() => {
    if (onVariantChange) onVariantChange(soldOutRef.current ? null : (selectedVariant || null), pickedByShopper);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId, pickedByShopper]);

  /**
   * The chosen variant's pricing, ready formatted by the API.
   *
   * `final` is what the shopper pays and `original` the list price; they differ
   * only while the variant's own discount is running, which is what `discounted`
   * reports. The page shows both in that case, with the list price struck out.
   */
  const pricingOf = (variant) => {
    const rows = (variant && variant.inventory) || [];
    const row = rows.find(r => (r.prices && r.prices.length) || r.price);
    if (!row) return null;
    const price = (row.prices && row.prices.length) ? row.prices[0] : null;
    const final = (price && price.finalPrice) || row.price;
    return {
      final,
      original: price ? price.originalPrice : null,
      discounted: !!(price && price.discounted),
      // the API formats prices ("₹32,100.00"); the number is only for comparing
      amount: Number(String(final || '').replace(/[^0-9.]/g, '')) || 0
    };
  };
  const selectedVariantPricing = pricingOf(selectedVariant);

  /*
   * Before a bead is chosen, a product whose beads are priced differently shows
   * "From" the cheapest. Its own price matched none of them (39,000 against
   * beads at 32,100 and 39,300), which only confused.
   */
  const fromPricing = (() => {
    if (selectedVariant) return null;
    const priced = (product.variants || []).map(pricingOf).filter(p => p && p.amount > 0);
    if (priced.length < 2) return null;
    const cheapest = priced.reduce((min, p) => (p.amount < min.amount ? p : min), priced[0]);
    const allSame = priced.every(p => p.amount === cheapest.amount);
    return { ...cheapest, from: !allSame };
  })();

  /**
   * How many the shopper may order.
   *
   * Once a variant is chosen it is that variant's stock -- each bead is its own
   * variant here, so that is usually 1. Before anything is chosen, the best a
   * parent could offer, so the box is not capped below a choice they have not
   * made yet. A product without variants keeps its own stock.
   */
  const stockQuantity = (() => {
    if (selectedVariant) return variantStock(selectedVariant);
    if ((product.variants || []).length > 0) {
      return product.variants.reduce(
        (most, variant) => Math.max(most, variantStock(variant)),
        0
      );
    }
    return Number(product.quantity) || 0;
  })();

  // Special offers (the Special category): at most SPECIAL_MAX_QUANTITY of the
  // product in one order, all its beads counted together. The cart and the
  // checkout refuse more as well.
  const isSpecialOffer = (product.categories || []).some(category => category.code === SPECIAL_CATEGORY_CODE);
  const maxQuantity = isSpecialOffer ? Math.min(stockQuantity, SPECIAL_MAX_QUANTITY) : stockQuantity;
  const specialLimitMessage = (inCart) =>
    (strings["You can order at most"] || "You can order at most") + " " + SPECIAL_MAX_QUANTITY + " "
    + (strings["of this special offer in one order"] || "of this special offer in one order")
    + (inCart ? " (" + inCart + " " + (strings["already in your cart"] || "already in your cart") + ")" : "");

  /*
   * Nothing left to buy: a product with beads whose every bead is sold, or a
   * product without beads that has no stock. The shopper can ask to be told
   * when it is back instead of meeting a dead "Out of stock" button.
   * (Enquiry-only products are never "sold out"; they are asked about.)
   */
  const hasVariants = (product.variants || []).length > 0;
  const soldOut = !enquiryOnly && (
    hasVariants
      ? product.variants.every(variant => variantStock(variant) <= 0)
      : !canAddToCart
  );
  soldOutRef.current = soldOut;

  // A choice can lower the ceiling under what is already in the box: picking a
  // single-bead variant after asking for three has to pull it back to one.
  useEffect(() => {
    if (maxQuantity > 0 && quantityCount > maxQuantity) {
      setQuantityCount(maxQuantity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxQuantity]);

  const sizeUnit = window._env_.APP_BEAD_SIZE_UNIT || '';
  const weightUnit = window._env_.APP_BEAD_WEIGHT_UNIT || '';
  const trimNumber = n => String(Number(n));
  // the categories this product can actually be browsed through
  const visibleProductCategories = (product.categories || [])
    .filter(category => category.visible !== false);

  /*
   * A variant option is shown as compact chips -- price, size, weight -- when
   * that is what tells the choices apart: each value is a variant with its own
   * photo or measurements. One-of-a-kind beads were otherwise chosen by lab
   * report number from a dropdown. The chosen bead's photo shows in the main
   * gallery, so the chips carry none. Anything else keeps the dropdown.
   */
  const beadChoices = (option) => {
    if (!option.variant) return null;
    const values = option.optionValues || [];
    if (values.length === 0) return null;
    const choices = values.map(value => {
      const variant = (product.variants || []).find(v => v.id === value.id);
      if (!variant) return null;
      const spec = variant.productSpecifications || {};
      const variantImage = variant.images && variant.images[0] && variant.images[0].imageUrl;
      return {
        value,
        variant,
        pricing: pricingOf(variant),
        stock: variantStock(variant),
        hasOwnLook: !!variantImage || !!(spec.width || spec.height || spec.weight),
        image: variantImage || (product.images && product.images[0] && product.images[0].imageUrl),
        size: spec.width && spec.height
          ? trimNumber(spec.width) + " × " + trimNumber(spec.height) + (sizeUnit ? " " + sizeUnit : "")
          : null,
        weight: spec.weight ? trimNumber(spec.weight) + (weightUnit ? " " + weightUnit : "") : null
      };
    });
    if (choices.some(c => !c) || !choices.every(c => c.hasOwnLook)) return null;
    return choices;
  };

  const checkedOrNot = (value) => {
    let index = selectedProductColor.findIndex(a => a.id === value.id);
    if (index === -1) {
      return false
    } else {
      return true
    }
  }
  return (
    <div className="product-details-content ml-70">
      {/* h1, not h2: this is the page's subject, and every product page was
          previously publishing an h1-less document */}
      <h1 className="product-title">{product.description.name}</h1>
      <div className="product-details-price">
        {/* Not sold directly, so there is no price to show: the figure is
            settled in the conversation that follows the enquiry. */}
        {/* sold by enquiry, or nothing left in stock: no price to quote until
            the shopper asks (or it is back) */}
        {enquiryOnly || soldOut ? (
          <span className="price-on-request">
            {strings["Price on request"] || "Price on request"}
          </span>
        ) : (
        <Fragment>
        {/*
          A chosen variant is priced in its own right -- these beads run from
          32,000 to 33,500 -- so the page shows that price rather than the
          product's. The variant's price comes with the product payload, so no
          extra call is needed; the cart is told the same variant and prices
          the line from it.
        */}
        {selectedVariantPricing ? (
          selectedVariantPricing.discounted ? (
            <Fragment>
              <span>{selectedVariantPricing.final}</span>{" "}
              <span className="old">{selectedVariantPricing.original}</span>
            </Fragment>
          ) : (
            <span>{selectedVariantPricing.final} </span>
          )
        ) : fromPricing ? (
          <span>
            {fromPricing.from ? (strings["From"] || "From") + " " : ""}{fromPricing.final}
          </span>
        ) : isDiscount ? (
          <Fragment>
            <span>{discountedPrice}</span>{" "}
            <span className="old">
              {productPrice}
            </span>
          </Fragment>
        ) : (
            <span>{productPrice} </span>
          )}
        </Fragment>
        )}
      </div>
      {/* Member-exclusive price: shown as actual price for logged-in members,
          or as a login teaser for anonymous visitors when the product has
          member pricing configured. */}
      {userData && product.memberExclusivePrice && (
        <div className="member-exclusive-price">
          <span className="member-exclusive-badge">
            &#128274; {strings["Member exclusive"] || "Member exclusive"}
          </span>
          {" "}
          <span className="member-exclusive-amount">
            {product.memberExclusivePrice}
          </span>
          {" — "}
          <span className="member-exclusive-note">
            {product.memberDiscountPercent
              ? `${product.memberDiscountPercent}% off for members`
              : (strings["5% off for members"] || "5% off for members")}
          </span>
        </div>
      )}
      {!userData && product.memberExclusiveEnabled && (
        <div className="member-exclusive-teaser">
          <span>&#128274;</span>
          <span>
            Member Exclusive pricing available on this product &mdash;{" "}
            <Link to="/login">
              Log in to save {product.memberDiscountPercent || 5}%
            </Link>
          </span>
        </div>
      )}
      {/* {product.rating && product.rating > 0 ? ( */}
      <div className="pro-details-rating-wrap">
        <div className="pro-details-rating">
          <StarRatings
            rating={product.rating}
            starRatedColor="#ffa900"
            starDimension="17px"
            starSpacing="1px"
            numberOfStars={5}
            name='view-rating'
          />
          {/* <Rating ratingValue={product.rating} /> */}
        </div>
      </div>
      {/* ) : (
          ""
        )} */}
      {/* Buying controls sit above the description: the shopper should be
          able to pick a variant, set a quantity and add to cart without
          scrolling past a long blurb first. The option selects move with
          them -- leaving those below would mean scrolling down to choose a
          variant and back up to add it, and the add-to-cart guard would
          block until you did. */}
      {/* the choices belong to buying; an enquiry-only product is asked about,
          not configured */}
      {/* nothing in stock: there is no choice to make, so the options go
          and the "notify me" block below stands on its own */}
      {product.options && !enquiryOnly && !soldOut ? (
        <div className="pro-details-size-color">
          {
            product.options.map((option, key) => {
              return (
                option.type === 'radio' &&
                <div className="pro-details-color-wrap" key={key}>
                  <span>{option.name}</span>
                  <div className="pro-details-color-content" style={{ display: 'flex', flexDirection: 'column' }}>
                    {

                      option.optionValues.map((value, index) => {
                        return (
                          <div style={{ flexDirection: 'row', display: 'flex', alignItems: 'center', margin: 15 }} key={index}>
                            {value.image && <img src={value.image} alt="product-option" />}

                            <label className={`pro-details-color-content--single`} style={{ backgroundColor: value.code }} key={index} >

                              <input
                                type={option.type}
                                value={value.id}
                                name={option.name}
                                checked={checkedOrNot(value)}
                                onChange={() => onChangeOptions(value, option)}
                              />
                              <span className="checkmark"></span>

                            </label>
                            <label>{value.description.name} {value.price && '(' + value.price + ')'}</label>
                          </div>
                        );
                      })
                      // )
                    }

                  </div>
                </div>
              )
            })
          }
          {

            product.options.map((option, index) => {
              const beads = beadChoices(option);
              return (
                option.type === 'select' && beads &&
                <div className="pro-details-beads" key={'beads-' + index}>
                  <span>{option.name}</span>
                  <div className="bead-chips">
                    {beads.map(({ value, pricing, stock, size, weight }) => {
                      const selected = checkedOrNot(value);
                      const beadSoldOut = stock <= 0;
                      // the lab report number stays one hover or long-press away
                      const code = (option.code === 'LAB_REPORT' ? (strings["Lab report"] || "Lab report") + ": " : "")
                        + value.description.name;
                      const details = [size, weight].filter(Boolean).join(" · ");
                      return (
                        <button
                          type="button"
                          key={value.id}
                          className={"bead-chip" + (selected ? " selected" : "") + (beadSoldOut ? " sold-out" : "")}
                          aria-pressed={selected}
                          disabled={beadSoldOut}
                          title={beadSoldOut ? code + " – " + (strings["Sold out"] || "Sold out") : code}
                          onClick={() => onChangeOptions(value, option)}>
                          {pricing && <b>{pricing.final.replace(/\.00$/, '')}</b>}
                          {details && <span>{details}</span>}
                          {/* nothing measured to tell it apart: fall back to its name */}
                          {!details && <span>{value.description.name}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            })
          }
          {

            product.options.map((option, index) => {
              return (
                option.type === 'select' && !beadChoices(option) &&
                <div className="pro-details-size" key={index}>
                  <span>{option.name}</span>
                  <div className="pro-details-size-content">
                    {
                      <select
                        value={selectedValueFor(option)}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          onChangeOptions(JSON.parse(e.target.value), option)
                        }}>
                        {/*
                          A placeholder first entry. Without it a <select> shows
                          its first real entry as though it were chosen, while
                          nothing is actually selected in state -- so the shopper
                          sees "Variant A" and is then told to pick a variant.
                        */}
                        <option value="">{"Select " + option.name}</option>
                        {

                          option.optionValues.map((singleSize, i) => {
                            return <option key={i} value={JSON.stringify(singleSize)}>{singleSize.description.name}  {singleSize.price && '(' + singleSize.price + ')'}</option>
                          })
                        }
                      </select>

                    }
                  </div>
                </div>
              )
            })
          }
          {

            product.options.map((option, index) => {
              return (
                option.type === 'checkbox' &&
                <div className="pro-details-size" key={index}>
                  <span>{option.name}</span>
                  <div className="pro-details-size-content" style={{ display: 'flex' }}>
                    {
                      option.optionValues.map((singleSize, key) => {
                        return (
                          <div style={{ flexDirection: 'column ', display: 'flex', alignItems: 'center', marginRight: 15 }} key={key}>
                            {singleSize.image && <img src={singleSize.image} alt="product-option" />}

                            <label className={`pro-details-size-content--single`} key={key}  >
                              <input
                                type="checkbox"
                                value={singleSize.description.name}
                                name={option.name}
                                checked={checkedOrNot(singleSize)}
                                onChange={() => {
                                  onChangeOptions(singleSize, option)
                                  // setSelectedProductSize(singleSize.name);
                                  //   setProductStock(singleSize.stock);
                                  //   setQuantityCount(1);
                                }}
                              />
                              <span className="size-name">{singleSize.description.name}  {singleSize.price && '(' + singleSize.price + ')'}</span>
                            </label>
                          </div>
                        );

                      })}
                  </div>
                </div>
              )
            })
          }
        </div>
      ) : (
          ""
        )}
      {
        //   product.affiliateLink ? (
        //   <div className="pro-details-quality">
        //     <div className="pro-details-cart btn-hover ml-0">
        //       <a
        //         href={product.affiliateLink}
        //         rel="noopener noreferrer"
        //         target="_blank"
        //       >
        //         Buy Now
        //       </a>
        //     </div>
        //   </div>
        // ) : (
        enquiryOnly ? (
          /*
           * Not sold over the counter: the shopper asks about it instead. The
           * form is deliberately short -- who they are, how to reach them, what
           * they want to know.
           */
          <div className="pro-details-enquiry">
            {!enquiryOpen && (
              <div className="pro-details-cart btn-hover">
                <button type="button" onClick={() => setEnquiryOpen(true)}>
                  {strings["Enquire about this product"] || "Enquire about this product"}
                </button>
              </div>
            )}
            {enquiryOpen && (
              <form onSubmit={submitEnquiry} className="enquiry-form">
                <input
                  type="text"
                  value={enquiry.name}
                  placeholder={strings["Your name"] || "Your name"}
                  onChange={e => setEnquiry({ ...enquiry, name: e.target.value })}
                />
                <input
                  type="email"
                  value={enquiry.email}
                  placeholder={strings["Your Email Address"] || "Your email address"}
                  onChange={e => setEnquiry({ ...enquiry, email: e.target.value })}
                />
                <input
                  type="text"
                  value={enquiry.phone}
                  placeholder={strings["Phone"] || "Phone"}
                  onChange={e => setEnquiry({ ...enquiry, phone: e.target.value })}
                />
                <textarea
                  rows="4"
                  value={enquiry.message}
                  placeholder={strings["How can we help you with this product?"]
                    || "How can we help you with this product?"}
                  onChange={e => setEnquiry({ ...enquiry, message: e.target.value })}
                />
                <div className="pro-details-cart btn-hover">
                  <button type="submit" disabled={enquirySending}>
                    {enquirySending
                      ? (strings["Sending"] || "Sending...")
                      : (strings["Send enquiry"] || "Send enquiry")}
                  </button>
                  <button type="button" className="enquiry-cancel" onClick={() => setEnquiryOpen(false)}>
                    {strings["Cancel"] || "Cancel"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : soldOut ? (
          <NotifyWhenAvailable
            product={product}
            hasVariants={hasVariants}
            defaultStore={defaultStore}
            currentLanguageCode={currentLanguageCode}
            defaultEmail={(userData && userData.email) || ""}
            strings={strings}
            addToast={addToast}
          />
        ) : (
        <div className="pro-details-quality">
          {/*
            A quantity box that can only say 1 is just noise. A chosen bead with
            one in stock is the exact bead in its photos, so that is said as the
            benefit it is; any other last item stays a plain stock note.
          */}
          {maxQuantity === 1 && selectedVariant ? (
          <p className="one-of-a-kind">
            <span className="one-of-a-kind__icon" aria-hidden="true">✦</span>
            <span>
              <b>{strings["One of a kind"] || "One of a kind"}</b>
              {" — " + (strings["you receive this exact bead"] || "you receive this exact bead")}
            </span>
          </p>
          ) : maxQuantity === 1 ? (
          <span className="single-stock">{strings["Only 1 available"] || "Only 1 available"}</span>
          ) : (
          <div className="cart-plus-minus">
            <button onClick={() => setQuantityCount(quantityCount > 1 ? quantityCount - 1 : 1)} className="dec qtybutton">-</button>
            <input
              className="cart-plus-minus-box"
              type="text"
              value={quantityCount}
              readOnly
            />
            {/* the ceiling is the chosen variant's stock, or the product's own
                when it has no variants -- see maxQuantity above */}
            <button
              onClick={() => {
                if (quantityCount < maxQuantity) {
                  setQuantityCount(quantityCount + 1);
                  return;
                }
                addToast(
                  isSpecialOffer && maxQuantity === SPECIAL_MAX_QUANTITY
                    ? specialLimitMessage()
                    : selectedVariant
                    ? "Only " + maxQuantity + " in stock for this selection"
                    : "Only " + maxQuantity + " in stock",
                  { appearance: "warning", autoDismiss: true }
                );
              }}
              disabled={quantityCount >= maxQuantity}
              className="inc qtybutton"
            >+</button>
          </div>
          )}
          {isSpecialOffer && !soldOut && (
            <p className="special-offer-limit">
              {(strings["Special offer: maximum"] || "Special offer: maximum") + " " + SPECIAL_MAX_QUANTITY + " "
                + (strings["per order, online payment only"] || "per order, online payment only")}
            </p>
          )}
          <div className="pro-details-cart btn-hover">
            {canAddToCart ? (
              <button
                onClick={() => {
                  let options = [];
                  selectedProductColor.forEach((a) => {
                    options.push({ id: a.id })
                  })

                  // Every option on a product is required, and none is
                  // pre-selected, so the shopper has to choose before ordering.
                  // Without this the button added the base product with an
                  // empty options array and the choice was silently lost.
                  const required = (product.options || []).filter(
                    o => (o.optionValues || []).length > 0
                  );
                  const chosen = new Set(selectedProductColor.map(o => o.name));
                  const missing = required.filter(o => !chosen.has(o.name));
                  if (missing.length > 0) {
                    // an option already worded as a request ("Choose your bead")
                    // is used as it is, not as "Please select Choose your bead"
                    addToast(
                      missing.map(o => /^(choose|select|pick)\b/i.test(o.name) ? o.name : "Please select " + o.name).join(", "),
                      { appearance: "warning", autoDismiss: true }
                    );
                    return;
                  }

                  // The quantity box is capped as it is stepped, but the count
                  // can also be left over from a larger selection, and what is
                  // already in the cart counts against the same stock.
                  //
                  // cartItems is the cart itself -- an object holding a
                  // `products` array -- not a list of items.
                  const lines = (cartItems && cartItems.products) || [];
                  const sameThing = line => {
                    const isThisProduct =
                      line.sku === product.sku || line.id === product.id;
                    if (!isThisProduct) return false;
                    // Stock is held per variant, so only the line holding the
                    // same variant counts against this one -- otherwise having
                    // one bead in the cart blocked adding a different bead of
                    // the same product.
                    //
                    // Matched on `code`: the cart line's variant.id is the id of
                    // the variation (the option/value pair), not of the variant,
                    // so the ids on the two sides are different numbers.
                    if (!selectedVariant) return true;
                    return (
                      line.variant &&
                      selectedVariant.code &&
                      line.variant.code === selectedVariant.code
                    );
                  };
                  const inCart = lines
                    .filter(sameThing)
                    .reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
                  // a special offer counts every bead of the product in the cart
                  if (isSpecialOffer) {
                    const inCartAll = lines
                      .filter(line => line.sku === product.sku || line.id === product.id)
                      .reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
                    if (quantityCount + inCartAll > SPECIAL_MAX_QUANTITY) {
                      addToast(specialLimitMessage(inCartAll), { appearance: "warning", autoDismiss: true });
                      return;
                    }
                  }
                  if (quantityCount + inCart > maxQuantity) {
                    const left = maxQuantity - inCart;
                    addToast(
                      left > 0
                        ? "Only " + left + " left in stock for this selection"
                        : "This selection is already in your cart",
                      { appearance: "warning", autoDismiss: true }
                    );
                    return;
                  }

                  addToCart(
                    product,
                    addToast,
                    cartItems,
                    quantityCount,
                    defaultStore,
                    userData,
                    options,
                    // the variant the shopper picked, so the line is priced
                    // from it rather than from the product
                    selectedVariant ? selectedVariant.id : null
                  )
                }}>
                {" "}
                {strings["Add to cart"]}{" "}
              </button>
            ) : (
                <button disabled>{strings["Out of Stock"]}</button>
              )}
          </div>
          {/* <div className="pro-details-wishlist">
            <button
              className={wishlistItem !== undefined ? "active" : ""}
              disabled={wishlistItem !== undefined}
              title={
                wishlistItem !== undefined
                  ? "Added to wishlist"
                  : "Add to wishlist"
              }
              onClick={() => addToWishlist(product, addToast)}
            >
              <i className="pe-7s-like" />
            </button>
          </div>
          <div className="pro-details-compare">
            <button
              className={compareItem !== undefined ? "active" : ""}
              disabled={compareItem !== undefined}
              title={
                compareItem !== undefined
                  ? "Added to compare"
                  : "Add to compare"
              }
              onClick={() => addToCompare(product, addToast)}
            >
              <i className="pe-7s-shuffle" />
            </button>
          </div> */}
        </div>
        )
        // )
      }

      <div className="pro-details-list">
        {/*
          The block under Add to Cart is the product's Highlight field, edited
          per product in the admin (Catalogue > Products > edit > Highlight) in
          the same rich-text editor as the description. It is its own field, so
          this copy can be short and sales-facing while the full description
          keeps its place in the tab below.

          Products with no highlight yet fall back to the description, so the
          page is never left blank -- drop the `|| ...` to show nothing instead.
        */}
        <ProductDescription
          text={
            (product.description.highlights &&
              product.description.highlights.trim()) ||
            product.description.description
          }
        />
      </div>
      {/* The SKU belongs to the variant the shopper picks, so a parent's own
          code is not shown -- it is an internal grouping record, not the thing
          being bought. */}
      {!isParent && (
        <div className="pro-details-meta">
          <span>{strings["SKU"]} :</span>
          <ul>
            <li >
              <Link to="">
                {product.sku}
              </Link>
            </li>
          </ul>
        </div>
      )}
      {/* only the ones a shopper can actually get to: a hidden category has no
          page behind it, so listing it here would hand out a dead link */}
      {visibleProductCategories.length > 0 ? (
        <div className="pro-details-meta">
          <span>{strings["Categories"]} :</span>
          <ul>
            {visibleProductCategories.map((single, key) => {
              return (
                <li key={key}>
                  <Link to={"/category/" + single.description.friendlyUrl}>
                    {single.description.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
          ""
        )}
      {/* {product.tag ? (
        <div className="pro-details-meta">
          <span>Tags :</span>
          <ul>
            {product.tag.map((single, key) => {
              return (
                <li key={key}>
                  <Link to={process.env.PUBLIC_URL + "/shop-grid-standard"}>
                    {single}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
          ""
        )} */}
      {/**
      <div className="pro-details-social">
        <ul>
          <li>
            <a href="//facebook.com">
              <i className="fa fa-facebook" />
            </a>
          </li>
          <li>
            <a href="//dribbble.com">
              <i className="fa fa-dribbble" />
            </a>
          </li>
          <li>
            <a href="//pinterest.com">
              <i className="fa fa-pinterest-p" />
            </a>
          </li>
          <li>
            <a href="//twitter.com">
              <i className="fa fa-twitter" />
            </a>
          </li>
          <li>
            <a href="//linkedin.com">
              <i className="fa fa-linkedin" />
            </a>
          </li>
        </ul>
      </div>
      */}
    </div>
  );
};

ProductDescriptionInfo.propTypes = {
  addToCart: PropTypes.func,
  // addToCompare: PropTypes.func,
  // addToWishlist: PropTypes.func,
  addToast: PropTypes.func,
  cartItems: PropTypes.object,
  // compareItem: PropTypes.array,
  // currency: PropTypes.object,
  // discountedPrice: PropTypes.number,
  finalDiscountedPrice: PropTypes.string,
  finalProductPrice: PropTypes.string,
  onVariantChange: PropTypes.func,
  product: PropTypes.object,
  // wishlistItem: PropTypes.object
};
const mapStateToProps = (state, ownProps) => {
  const prodID = ownProps.product.id;
  return {
    productID: prodID,
    cartItems: state.cartData.cartItems,
    defaultStore: state.merchantData.defaultStore,
    userData: state.userData.userData,
    currentLanguageCode: state.multilanguage.currentLanguageCode
  };
};
const mapDispatchToProps = dispatch => {
  return {
    setLoader: (value) => {
      dispatch(setLoader(value));
    },
    addToCart: (
      item,
      addToast,
      cartItem,
      quantityCount,
      defaultStore,
      userData,
      selectedProductColor,
      selectedVariant
    ) => {

      // The existing line only counts when it holds the same variant; matching
      // on the product alone sent the other variant's quantity along and the
      // second variant could never be added as its own line. Variant lines are
      // compared by code, since the cart reports the variation's id there.
      const variantCode = (item.variants || []).reduce(
        (found, v) => (found || (selectedVariant && v.id === selectedVariant ? v.code : null)),
        null
      );
      let index = isValidObject(cartItem)
        ? cartItem.products.findIndex(cart => {
            if (cart.id !== item.id) return false;
            if (!variantCode) return !cart.variant;
            return cart.variant && cart.variant.code === variantCode;
          })
        : -1;
      dispatch(
        addToCart(
          item,
          addToast,
          cartItem.code,
          index === -1 ? quantityCount : cartItem.products[index].quantity + quantityCount,
          defaultStore,
          userData,
          selectedProductColor,
          selectedVariant
        )
      );
    },
    // addToWishlist: (item, addToast) => {
    //   dispatch(addToWishlist(item, addToast));
    // },
    // addToCompare: (item, addToast) => {
    //   dispatch(addToCompare(item, addToast));
    // }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ProductDescriptionInfo);
