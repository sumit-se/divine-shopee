import WebService from '../../util/webService';
import constant from '../../util/constant';

import { setLoader } from "../actions/loaderActions";
import { setLocalData, getLocalData } from '../../util/helper';
import Cookies from 'universal-cookie';
export const GET_SHOPIZER_CART_ID = "GET_SHOPIZER_CART_ID";
export const GET_CART = "GET_CART";
export const ADD_TO_CART = "ADD_TO_CART";
export const DECREASE_QUANTITY = "DECREASE_QUANTITY";
export const INCREASE_QUANTITY = "INCREASE_QUANTITY";
export const DELETE_FROM_CART = "DELETE_FROM_CART";
export const DELETE_ALL_FROM_CART = "DELETE_ALL_FROM_CART";

//add to cart
export const addToCart = (item, addToast, cartId, quantityCount, defaultStore, userData, selectedProductOptions, selectedVariant) => {
  return async dispatch => {
    dispatch(setLoader(true))
    try {
      let action;
      let param;
      let response;
      let message;
      console.log('Item ' + item.sku + " quantity " + quantityCount);
      if (selectedProductOptions !== undefined) {
        param = { "attributes": selectedProductOptions, "product": item.sku, "quantity": quantityCount }
      } else {
        param = { "product": item.sku, "quantity": quantityCount }
      }
      // The chosen variant prices the line. Without it the cart falls back to
      // the first variant on the product and charges its price for every
      // choice, which is wrong as soon as two variants differ in price.
      if (selectedVariant) {
        param.variant = selectedVariant;
      }
      console.log('Cart parameters ' + JSON.stringify(param));
      if (cartId) {
        message = "Updated Cart"
        action = constant.ACTION.CART + cartId + '?store=' + window._env_.APP_MERCHANT;
        response = await WebService.put(action, param);
      } else {
        message = "Added Cart"
        action = constant.ACTION.CART + '?store=' + window._env_.APP_MERCHANT
        response = await WebService.post(action, param);
      }

      //refresh cart
      // console.log('Cart response' + JSON.stringify(response));
      if (response) {
        dispatch(setShopizerCartID(response.code))
        dispatch(setLoader(false))
        /*
         * The add response is the whole cart, so the badge and the mini cart can
         * show it straight away. A signed-in shopper used to wait two seconds
         * for the refresh below -- and saw no change at all when they moved on
         * before it landed.
         */
        dispatch({ type: GET_CART, payload: response });
        if (userData) {
          setTimeout(() => {
            dispatch(getCart(response.code, userData));
          }, 2000);

        } else {
          dispatch(getCart(response.code, userData));
        }
        if (addToast) {
          addToast(message, { appearance: "success", autoDismiss: true });
        }
      }
    } catch (error) {
      dispatch(setLoader(false))
      // a rule the shopper can act on (e.g. the most of a special offer one
      // order may hold) comes back as the error's message
      const reason = error && error.response && error.response.data && error.response.data.message;
      if (addToast && reason) {
        addToast(reason, { appearance: "warning", autoDismiss: true });
      }
    }

  };
};

//Get cart

export const getCart = (cartID, userData) => {
  return async dispatch => {
    const language = JSON.parse(getLocalData('redux_localstorage_simple')).multilanguage.currentLanguageCode;

    // the cart read by its own code, which works signed in or not
    const cartAction = cartID
      // The cart is created against the store (POST /cart?store=...), so the
      // read-back needs the same scope. Without store= it fell back to
      // DEFAULT, 404'd, and the badge stayed at 0 even though the item had
      // been added successfully.
      ? constant.ACTION.CART + cartID + '?store=' + window._env_.APP_MERCHANT + '&lang=' + language
      : null;
    // the signed-in customer's own cart, which is how a cart started on another
    // device is picked up after signing in
    const customerCartAction = constant.ACTION.AUTH + constant.ACTION.CUSTOMER + constant.ACTION.CARTS
      + (cartID ? '?cart=' + cartID : '?') + '&lang=' + language;

    if (!userData && !cartAction) {
      // no cart to read and nobody to read it for
      return;
    }

    try {
      let response;
      if (userData) {
        try {
          response = await WebService.get(customerCartAction);
        } catch (error) {
          /*
           * A cart started before signing in is not attached to the customer, so
           * this lookup answers 404 while the cart itself is perfectly alive.
           * Treating that as "no cart" wiped a cart the shopper had just filled:
           * the header emptied on the next page load and /cart bounced back to
           * the home page. Fall back to reading the cart by its own code.
           */
          if (!cartAction) {
            throw error;
          }
          response = await WebService.get(cartAction);
        }
      } else {
        response = await WebService.get(cartAction);
      }
      dispatch(setShopizerCartID(response.code))
      dispatch({
        type: GET_CART,
        payload: response
      });

    } catch (error) {
      console.log('Cart action response ' + error);
      /*
       * Only forget the cart when the server says it is not there. Any error at
       * all used to empty it, so a single hiccup -- the API restarting, the
       * network dropping a request -- threw away a cart the shopper had filled
       * and left /cart with nothing to show.
       */
      const status = error && error.response && error.response.status;
      if (status === 404 || status === 400) {
        dispatch(deleteAllFromCart())
      }
    }
  }
  // }
}
export const setShopizerCartID = (id) => {
  //set local data
  // set cart id in cookie
  var cart_cookie = window._env_.APP_MERCHANT + '_shopizer_cart';
  const cookies = new Cookies();
  cookies.set(cart_cookie, id, { path: '/', maxAge: 20000000 });//6 months
  setLocalData(GET_SHOPIZER_CART_ID, id);
  return dispatch => {
    dispatch({
      type: GET_SHOPIZER_CART_ID,
      payload: id
    });
  }
}

export const getShopizerCartID = () => {
  //set local data
  // set cart id in cookie
  var cart_cookie = window._env_.APP_MERCHANT + '_shopizer_cart';
  const cookies = new Cookies();
  let cookie = cookies.get(cart_cookie);
  if (cookie) {
    getCart(cookie, null);
  }

}




//decrease from cart
export const decreaseQuantity = (item, addToast) => {
  console.log('decrease ' + JSON.stringify(item));
  return dispatch => {
    // if (addToast) {
    //   addToast("Item Decremented From Cart", {
    //     appearance: "warning",
    //     autoDismiss: true
    //   });
    // }
    // dispatch({ type: DECREASE_QUANTITY, payload: item });

  };
};

export const increaseQuantity = (item, addToast) => {
  console.log('increase ' + JSON.stringify(item));
  return dispatch => {
    // if (addToast) {
    //   addToast("Item Decremented From Cart", {
    //     appearance: "warning",
    //     autoDismiss: true
    //   });
    // }
    // dispatch({ type: DECREASE_QUANTITY, payload: item });

  };
};


//delete from cart
export const deleteFromCart = (cartID, item, defaultStore, addToast, userData) => {
  return async dispatch => {
    dispatch(setLoader(true))
    try {
      /*
       * The endpoint takes a sku. This sent `item.id`, which is the product's id
       * -- it matched no sku at all, so the API removed nothing and the line came
       * back on the next read. A line with a variant answers to the variant's
       * sku, which is also what tells two lines of the same product apart.
       */
      const sku = item.variantSku || item.sku;
      let action = constant.ACTION.CART + cartID + '/' + constant.ACTION.PRODUCT + sku + '?store=' + window._env_.APP_MERCHANT;
      await WebService.delete(action);

      dispatch({
        type: DELETE_FROM_CART,
        payload: item
      });
      if (addToast) {
        addToast("Removed From Cart", { appearance: "error", autoDismiss: true });
      }

      // read the cart back: the local splice matches on the product id, which
      // every line of a product with variants shares, so it can drop the wrong
      // row. What the server says is the truth.
      dispatch(getCart(cartID, userData));
      dispatch(setLoader(false))
    } catch (error) {
      console.log('Error removing from cart ' + cartID);
      dispatch(setLoader(false))
    }
  };
};
//delete all from cart
export const deleteAllFromCart = (orderID) => {
  return dispatch => {
    // if (addToast) {
    //   addToast("Removed All From Cart", {
    //     appearance: "error",
    //     autoDismiss: true
    //   });
    // }
    dispatch({ type: DELETE_ALL_FROM_CART, payload: orderID });
  };
};

// get stock of cart item
export const cartItemStock = (item, color, size) => {
  if (item.stock) {
    return item.stock;
  } else {
    return item.variation
      .filter(single => single.color === color)[0]
      .size.filter(single => single.name === size)[0].stock;
  }
};
