import PropTypes from "prop-types";
import React, { Fragment, useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import MetaTags from "react-meta-tags";
import { connect } from "react-redux";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
// import { getDiscountPrice } from "../../helpers/product";
// import Tab from "react-bootstrap/Tab";
// import Nav from "react-bootstrap/Nav";
import Layout from "../../layouts/Layout";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { isValidObject, setLocalData } from "../../util/helper";
import constant from '../../util/constant';
import WebService from '../../util/webService';
import { getShippingCountry, getState, getShippingState } from "../../redux/actions/userAction";
import { useForm, Controller } from "react-hook-form";
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement, Elements, ElementsConsumer
} from '@stripe/react-stripe-js';
import { useToasts } from "react-toast-notifications";
import { setLoader } from "../../redux/actions/loaderActions";
import {
  deleteAllFromCart
} from "../../redux/actions/cartActions";
import Script from 'react-load-script';
import { multilanguage } from "redux-multilanguage";



const stripePromise = loadStripe(window._env_.APP_STRIPE_KEY);
const paymentForm = {
  firstName: {
    name: "firstName",
    validate: {
      required: {
        value: true,
        message: "Firstname is required"
      }
    }
  },
  lastName: {
    name: "lastName",
    validate: {
      required: {
        value: true,
        message: "Lastname is required"
      }
    }
  },
  company: {
    name: "company"
  },
  address: {
    name: "address",
    validate: {
      required: {
        value: true,
        message: "Address is required"
      }
    }
  },
  city: {
    name: "city",
    validate: {
      required: {
        value: true,
        message: "City is required"
      }
    }
  },
  country: {
    name: "country",
    validate: {
      required: {
        value: true,
        message: "Country is required"
      }
    }
  },
  stateProvince: {
    name: "stateProvince",
    validate: {
      required: {
        value: true,
        message: "State is required"
      }
    }
  },
  postalCode: {
    name: "postalCode",
    validate: {
      required: {
        value: true,
        message: "Postal code is required"
      }
    }
  },
  phone: {
    name: "phone",
    validate: {
      required: {
        value: true,
        message: "Phone number is required"
      },
      minLength: {
        value: 10,
        message: "Enter a 10-digit number"
      }
    }
  },
  email: {
    name: "email",
    validate: {
      required: {
        value: true,
        message: "Email is required"
      },
      pattern: {
        value: /^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i,
        message: 'Please entered the valid email id'
      }
    }
  },
  shipFirstName: {
    name: "shipFirstName",
    validate: {
      required: {
        value: true,
        message: "Firstname is required"
      }
    }
  },
  shipLastName: {
    name: "shipLastName",
    validate: {
      required: {
        value: true,
        message: "Lastname is required"
      }
    }
  },
  shipCompany: {
    name: "shipCompany"
  },
  shipAddress: {
    name: "shipAddress",
    validate: {
      required: {
        value: true,
        message: "Address is required"
      }
    }
  },
  shipCity: {
    name: "shipCity",
    validate: {
      required: {
        value: true,
        message: "City is required"
      }
    }
  },
  shipCountry: {
    name: "shipCountry",
    validate: {
      required: {
        value: true,
        message: "Country is required"
      }
    }
  },
  shipStateProvince: {
    name: "shipStateProvince",
    validate: {
      required: {
        value: true,
        message: "State is required"
      }
    }
  },
  shipPostalCode: {
    name: "shipPostalCode",
    validate: {
      required: {
        value: true,
        message: "Postal code is required"
      }
    }
  },
  isAgree: {
    name: "isAgree",
    validate: {
      required: {
        value: true,
        message: "Please agree to our terms and conditions"
      }
    }
  },
  password: {
    name: "password",
    validate: {
      required: {
        value: true,
        message: "Password is required"
      },
      validate: {
        hasSpecialChar: (value) => (value && value.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/)) || 'Password must be minimum of 8 characters atleast one number and one special character'
      }
    }
  },
  repeatPassword: {
    name: "repeatPassword",
    validate: {
      required: {
        value: true,
        message: "Repeat Password is required"
      }
    }
  }
}
const CARD_ELEMENT_OPTIONS = {
  iconStyle: "solid",
  hidePostalCode: true,
  style: {
    base: {
      iconColor: "#303238",
      color: "#303238",
      fontSize: "16px",
      fontFamily: '"Open Sans", sans-serif',
      fontSmoothing: "antialiased",
      "::placeholder": {
        color: "#CFD7DF"
      }
    },
    invalid: {
      color: "#e5424d",
      ":focus": {
        color: "#e5424d"
      }
    }
  }
};
const Checkout = ({shipStateData, isLoading, currentLanguageCode, merchant, strings, location, cartID, defaultStore,getShippingCountry, getState,getShippingState,  shipCountryData, stateData, currentLocation, userData, setLoader, deleteAllFromCart }) => {
  const { pathname } = location;
  const history = useHistory();
  const { addToast } = useToasts();

  const [config, setConfig] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [isShipping, setIsShipping] = useState(false);
  const [isAccount, setIsAccount] = useState(false);
  const [timer, setTimer] = useState('');
  const [shippingOptions, setShippingOptions] = useState();
  const [shippingQuote, setShippingQuote] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState('');
  const [deliveryData, setDeliveryData] = useState();
  const [agreementData, setAgreementData] = useState('');
  // false once the store says it will not send cash on delivery to the postcode
  const [codPostalAllowed, setCodPostalAllowed] = useState(true);
  /*
   * Which ways the shopper may pay. APP_PAYMENT_TYPE used to name a single
   * method and the page was built around it; it now takes a comma separated
   * list ("COD,STRIPE"), so a store can offer more than one and the shopper
   * picks. A single value still behaves exactly as before.
   */
  const enabledPayments = String(window._env_.APP_PAYMENT_TYPE || 'STRIPE')
    .split(',')
    .map(method => method.trim().toUpperCase())
    .filter(method => method.length > 0);
  const [paymentMethod, setPaymentMethod] = useState(enabledPayments[0]);
  /*
   * Cash on delivery is only offered below this amount: a courier collecting
   * several thousand rupees at the door is a risk the store does not take, so
   * anything from this total upwards has to be paid for online. The backend
   * refuses such an order as well, in case the choice is made elsewhere.
   */
  const codMaxAmount = (() => {
    const configured = window._env_.APP_COD_MAX_AMOUNT;
    if (configured === undefined || configured === '' || isNaN(Number(configured))) {
      return 2000;
    }
    return Number(configured); // 0 or less means no limit
  })();
  const { register, control, handleSubmit, errors, setValue, watch, reset, setError, clearErrors } = useForm({
    mode: "onChange",
    criteriaMode: "all"
  });




  // console.log(window._env_.APP_PAYMENT_TYPE);
  const [ref, setRef] = useState(null)

  /*
   * The card element is only mounted while card is the chosen method, and
   * Stripe destroys it on the way out. Dropping the reference at the same time
   * keeps it from pointing at something that no longer exists -- the clear on
   * the success path catches that case anyway, but there is no reason to hold
   * a dead handle until then.
   */
  useEffect(() => {
    if (paymentMethod !== 'STRIPE') setRef(null);
  }, [paymentMethod]);
  /*
   * Bank transfer / UPI is the store's "moneyorder" payment module: the order
   * is placed now and paid by the shopper afterwards, to the bank or UPI
   * details entered in Admin > Payment. Whether it is switched on there and
   * what those details are both come from the API, so the option only shows
   * when the store actually offers it.
   */
  const [bankTransfer, setBankTransfer] = useState({ active: false, details: null });
  useEffect(() => {
    WebService.get('payment/bank-transfer?store=' + defaultStore)
      .then(response => setBankTransfer({
        active: !!(response && response.active),
        details: (response && response.details) || null
      }))
      .catch(() => setBankTransfer({ active: false, details: null }));
  }, [defaultStore]);
  useEffect(() => {
    getSummaryOrder()
    // getNuviePayment()
    getState('')
    getShippingState('')
    getShippingCountry(currentLanguageCode);
    getConfig()
    shippingQuoteChange('')
    onChangeShipping()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSummaryOrder = async () => {
    setLoader(true)
    console.log('GET SUMMARY')
    let action = constant.ACTION.CART + cartID + '?store=' + defaultStore;
    try {
      let response = await WebService.get(action);
      // console.log(JSON.stringify(response));
      if (response) {
        setLoader(false)
        setCartItems(response)
      }
    } catch (error) {
      setLoader(false) 
      deleteAllFromCart()
      setTimeout(() => {
        history.push('/')
      }, 200);
      
    }
    if (userData) {
      getProfile()
    } else {
      setDefaultsValue()
    }
  }
  const setDefaultsValue = () => {
    if (currentLocation.length > 0) {
      setValue('country', currentLocation.find(i => i.types.some(i => i === "country")).address_components[0].short_name)
      setValue('city', currentLocation.find(i => i.types.some(i => i === "locality")).address_components[0].short_name)
      setValue('stateProvince', currentLocation.find(i => i.types.some(i => i === "administrative_area_level_1")).address_components[0].short_name)
    }
  }
  const getProfile = async () => {
    let action = constant.ACTION.AUTH + constant.ACTION.CUSTOMER + constant.ACTION.PROFILE;
    try {
      let response = await WebService.get(action);
      if (response) {
        getState(response.billing.country)
        // console.log(response.billing.firstName);
        setValue('firstName', response.billing.firstName)
        setValue('lastName', response.billing.lastName)
        setValue('company', response.billing.company)
        setValue('address', response.billing.address)
        setValue('country', response.billing.country)
        setValue('city', response.billing.city)
        setTimeout(() => {
          setValue('stateProvince', response.billing.zone)
        }, 1000)
        setValue('postalCode', response.billing.postalCode)
        setValue('phone', response.billing.phone)
        setValue('email', response.emailAddress)

        if (response.delivery) {
          setDeliveryData(response.delivery)
        //   getShippingState(response.delivery.country)
        //   setValue('shipFirstName', response.delivery.firstName)
        //   setValue('shipLastName', response.delivery.lastName)
        //   setValue('shipCompany', response.delivery.company)
        //   setValue('shipAddress', response.delivery.address)
        //   setValue('shipCountry', response.delivery.country)
        //   setValue('shipCity', response.delivery.city)
        //   setTimeout(() => {
        //     setValue('shipStateProvince', response.delivery.zone)
        //   }, 1000)
        //   // setValue('shipStateProvince', response.delivery.stateProvince)
        //   setValue('shipPostalCode', response.delivery.postalCode)
        }
        
        onChangeShipping()
        // setConfig(response)
      }
    } catch (error) {
    }
  }
  const getConfig = async () => {
    let action = constant.ACTION.CONFIG;
    try {
      let response = await WebService.get(action);
      if (response) {
        setConfig(response)
      }
    } catch (error) {
    }
  }

  // const onChangeAddress = async () => {
  //   //console.log('Change address');
  // }
  const onChangeShipAddress = async () => {
    setIsShipping(!isShipping)
    // console.log(currentLocation.find(i => i.types.some(i => i == "country")).address_components[0].short_name)
    setTimeout(() => {
      if (userData) {
            if(deliveryData){
            getShippingState(deliveryData.country)
            setValue('shipFirstName', deliveryData.firstName)
            setValue('shipLastName', deliveryData.lastName)
            setValue('shipCompany', deliveryData.company)
            setValue('shipAddress', deliveryData.address)
            setValue('shipCountry', deliveryData.country)
            setValue('shipCity', deliveryData.city)
            setTimeout(() => {
              setValue('shipStateProvince', deliveryData.zone)
            }, 1000)
            // setValue('shipStateProvince', response.delivery.stateProvince)
            setValue('shipPostalCode', deliveryData.postalCode)
          }
       } else{
        if(currentLocation.length > 0) {
          //console.log(currentLocation);
          setTimeout(() => {
            getShippingState(currentLocation.find(i => i.types.some(i => i === "country")).address_components[0].short_name)
            setValue('shipCountry', currentLocation.find(i => i.types.some(i => i === "country")).address_components[0].short_name)
            setValue('shipCity', currentLocation.find(i => i.types.some(i => i === "locality")).address_components[0].short_name)
            setTimeout(() => {
              setValue('shipStateProvince', currentLocation.find(i => i.types.some(i => i === "administrative_area_level_1")).address_components[0].short_name)
            }, 1000)
            
            onChangeShipping()
          }, 1000);
        }
      }
    }, 1000);
     
  }
  const handleScriptLoad = () => {
    // Declare Options For Autocomplete
    const options = {
      types: ['address'],
    };
    // console.log('fsdfsdfsdfdsf')
    // Initialize Google Autocomplete
    /*global google*/ // To disable any eslint 'google not defined' errors
    let autocomplete = new google.maps.places.Autocomplete(
      document.getElementById('autocomplete'),
      options,
    );
    // console.log(autocomplete)
    // Avoid paying for data that you don't need by restricting the set of
    // place fields that are returned to just the address components and formatted
    // address.
    // this.autocomplete.setFields(['address_components', 'formatted_address']);

    // Fire Event when a suggested name is selected
    autocomplete.addListener('place_changed', () => {
      let p = autocomplete.getPlace();
      // console.log(p);
      setValue('country', p.address_components.find(i => i.types.some(i => i === "country")).short_name)
      getState(p.address_components.find(i => i.types.some(i => i === "country")).short_name)

      let city = p.address_components.find(i => i.types.some(i => i === "locality"))
      if (city !== undefined) {
        setValue('city', city.short_name)
      }
      let pCode = p.address_components.find(i => i.types.some(i => i === "postal_code"))
      if (pCode !== undefined) {
        setValue('postalCode', pCode.long_name)
      }

      var componentForm = {
        street_number: 'short_name',
        route: 'long_name',
        sublocality: 'sublocality'
      };
      let array = [];
      for (var i = 0; i < p.address_components.length; i++) {
        var addressType = p.address_components[i].types[0];
        if (componentForm[addressType]) {
          var val = p.address_components[i][componentForm[addressType]];
          array.push(val);

        }
      }
      setValue('address', array.toString())
      setTimeout(() => {
        setValue('stateProvince', p.address_components.find(i => i.types.some(i => i === "administrative_area_level_1")).short_name)
      }, 2000);

      onChangeShipping()
    });
  }
  const onChangeShipping = async () => {
    // every /cart/* call is store-scoped; without store= it falls back to
    // DEFAULT and 404s, which silently broke shipping and totals at checkout.
    let action = constant.ACTION.CART + cartID + '/' + constant.ACTION.SHIPPING
      + '?store=' + defaultStore + '&lang=' + currentLanguageCode;
    let param = {};

    //console.log('CHANGE SHIPPING');

    if (isShipping) {
      param = { 'postalCode': watch('shipPostalCode'), 'countryCode': watch('shipCountry') }
    } else {
      param = { 'postalCode': watch('postalCode'), 'countryCode': watch('country'), "zpneCode": watch('shipStateProvince') }
    }
    try {
      let response = await WebService.post(action, param);
      if (response) {
        const opts = response.shippingOptions;
        if (!opts || opts.length === 0) {
          shippingQuoteChange('');
          setShippingOptions(null);
        } else {
          const lastQuoteId = opts[opts.length - 1].shippingQuoteOptionId;
          shippingQuoteChange(lastQuoteId);
          setShippingOptions(opts);
          setSelectedOptions(lastQuoteId);
        }
      }
    } catch (error) {
    }
  }
  const shippingQuoteChange = async (quoteID, method) => {
    let action;

    //console.log('SHIPPING QUOTE CHANGED');

    /*
     * Cash on delivery carries a convenience fee, so the totals are quoted for
     * the method the shopper has chosen. Asking the server rather than adding
     * the fee here keeps one implementation of the rule: the same call decides
     * what is displayed, what is submitted as the amount, and -- through the
     * same calculation on the order itself -- what is charged.
     */
    const forMethod = method === undefined ? paymentMethod : method;
    const paymentParam = forMethod === 'COD' ? '&paymentMethod=COD' : '';

    if (quoteID) {
      action = constant.ACTION.CART + cartID + '/' + constant.ACTION.TOTAL + '?quote=' + quoteID
        + '&store=' + defaultStore + '&lang=' + currentLanguageCode + paymentParam;
    } else {
      action = constant.ACTION.CART + cartID + '/' + constant.ACTION.TOTAL
        + '?store=' + defaultStore + '&lang=' + currentLanguageCode + paymentParam;
    }
    // console.log('Shipping action ' +action);
    try {
      let response = await WebService.get(action);
      // console.log('Order total response ' + JSON.stringify(response));
      if (response) {
        setShippingQuote(response.totals)
      }
    } catch (error) {
    }

  }
  /*
   * The cash-on-delivery convenience fee, as a quoted line, or null when the
   * shopper is paying another way. Matched on the total's code rather than its
   * title, which is translated.
   */
  const codFeeLine = shippingQuote.find(quote => quote.code === 'order.total.codfee') || null;
  const codFee = codFeeLine ? Number(codFeeLine.value) : 0;
  // What is payable, including the fee when there is one.
  const payableTotal = (() => {
    const total = shippingQuote.find(quote => quote.title === 'Total');
    return total ? Number(total.value) : 0;
  })();
  /*
   * The order's value, before any convenience fee.
   *
   * The ceiling below has to be measured against this rather than against what
   * is payable, or the rule would eat itself: a 1900 order would attract a 190
   * fee, reach 2090, cross the ceiling, lose cash on delivery and so lose the
   * fee that pushed it over -- flipping between the two states on every quote.
   */
  const orderTotal = payableTotal - codFee;
  const codWithinAmount = codMaxAmount <= 0 || orderTotal < codMaxAmount;
  // special offers (the Special category) are paid for up front
  const [codSpecialBlocked, setCodSpecialBlocked] = useState(false);
  /*
   * What paying at the door would cost, and the rule behind it, both from the
   * server. Held separately from the quoted fee line so the charge can be shown
   * next to the option before the shopper picks it -- at which point there is
   * no fee line yet, because the totals are still quoted for another method.
   */
  const [codFeeInfo, setCodFeeInfo] = useState({ fee: null, minimum: null, percent: null });
  const codAvailable = codWithinAmount && codPostalAllowed && !codSpecialBlocked;
  // what the shopper may actually choose from right now
  const availablePayments = enabledPayments.filter(method =>
    (method !== 'COD' || codAvailable) && (method !== 'MONEYORDER' || bankTransfer.active));

  /*
   * Some postcodes are on the store's cash-on-delivery blocklist. Ask about the
   * one the parcel is going to -- the shipping address when there is one -- so
   * the option is gone before the shopper picks it rather than the order being
   * refused afterwards.
   */
  const billingPostalCode = watch('postalCode');
  const shippingPostalCode = isShipping ? watch('shipPostalCode') : null;
  // both addresses count, as they do in the payment module: a parcel going to a
  // restricted code is not paid for at the door whichever box holds it
  const postalCodesToCheck = [shippingPostalCode, billingPostalCode].filter(code => !!code);
  const [restrictedPostalCode, setRestrictedPostalCode] = useState(null);
  // set when the store does not deliver to the address at all
  const [noDeliveryPostalCode, setNoDeliveryPostalCode] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const checkPostalCodes = async () => {
      if (postalCodesToCheck.length === 0) {
        setCodPostalAllowed(true);
        setRestrictedPostalCode(null);
        setNoDeliveryPostalCode(null);
        return;
      }
      try {
        for (const code of postalCodesToCheck) {
          const response = await WebService.get('cod/availability?postalCode='
            + encodeURIComponent(code) + '&store=' + defaultStore
            + '&lang=' + currentLanguageCode);
          if (cancelled) {
            return;
          }
          if (response && response.available === false
              && (response.reason === 'POSTAL_CODE' || response.reason === 'NO_DELIVERY')) {
            setCodPostalAllowed(false);
            setRestrictedPostalCode(code);
            // the store does not ship there at all, which is worth saying plainly
            setNoDeliveryPostalCode(response.reason === 'NO_DELIVERY' ? code : null);
            return;
          }
        }
        setCodPostalAllowed(true);
        setRestrictedPostalCode(null);
        setNoDeliveryPostalCode(null);
      } catch (error) {
        // the question could not be asked; the payment module still refuses the
        // order if the postcode is on the list
        if (!cancelled) {
          setCodPostalAllowed(true);
          setRestrictedPostalCode(null);
        }
      }
    };
    checkPostalCodes();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCodesToCheck.join(','), defaultStore]);

  // Is anything in the cart a special offer? Asked again whenever the cart
  // changes; the payment module refuses cash on delivery for it either way.
  useEffect(() => {
    let cancelled = false;
    if (!cartID) {
      setCodSpecialBlocked(false);
      return;
    }
    /*
     * The pre-fee order value is sent so the response can price the fee. It is
     * deliberately the pre-fee figure: it does not move when the shopper
     * switches payment method, so this does not re-run every time they do.
     */
    WebService.get('cod/availability?cart=' + encodeURIComponent(cartID) + '&store=' + defaultStore
      + '&amount=' + encodeURIComponent(orderTotal)
      + '&lang=' + currentLanguageCode)
      .then(response => {
        if (!cancelled) {
          setCodSpecialBlocked(!!response && response.available === false && response.reason === 'SPECIAL');
          setCodFeeInfo({
            fee: response && response.fee != null ? Number(response.fee) : null,
            minimum: response && response.feeMinimum != null ? Number(response.feeMinimum) : null,
            percent: response && response.feePercent != null ? Number(response.feePercent) : null
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCodSpecialBlocked(false);
          setCodFeeInfo({ fee: null, minimum: null, percent: null });
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartID, defaultStore, orderTotal, ((cartItems && cartItems.products) || []).map(p => p.id + ':' + p.quantity).join(',')]);

  // a total that crosses the threshold takes cash on delivery away mid-checkout,
  // so the selection has to move to something still on offer
  useEffect(() => {
    if (availablePayments.length > 0 && availablePayments.indexOf(paymentMethod) === -1) {
      setPaymentMethod(availablePayments[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePayments.join(','), paymentMethod]);

  /*
   * Switching to or from cash on delivery changes what is owed, so the totals
   * are quoted again. This cannot loop: the quote only ever adds or removes the
   * fee line, and the ceiling that decides which methods are on offer is
   * measured on the pre-fee value, which the fee does not move.
   */
  useEffect(() => {
    if (!cartID) return;
    shippingQuoteChange(selectedOptions, paymentMethod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod]);

  // Cash on delivery is offline: no card element, no token, no gateway call.
  const isCashOnDelivery = paymentMethod === 'COD';
  // so is bank transfer / UPI: the shopper pays after the order is placed
  const isBankTransfer = paymentMethod === 'MONEYORDER';
  /*
   * Razorpay covers cards, UPI, netbanking and wallets behind one hosted
   * checkout, so there is no card element on our side: the shopper never types
   * a card number into this page. RBI requires an OTP step on every domestic
   * card payment, which Razorpay's own checkout runs.
   */
  const isRazorpay = paymentMethod === 'RAZORPAY';

  /** COD has nothing to tokenise, so it goes straight to placing the order. */
  const onSubmitCodOrder = async (data) => {
    if (isCashOnDelivery && !codAvailable) {
      // the option should already be gone; this is the last word on it
      addToast(codUnavailableMessage(), { appearance: "error", autoDismiss: true });
      return;
    }
    if (!cartID) {
      // nothing to check out; leaving the loader on froze the page behind it
      history.push("/");
      return;
    }
    setLoader(true);
    onPayment(data, null);
  };

  /**
   * An amount with the store's currency on it. The store model carries a
   * currency code rather than a symbol, so the formatter turns one into the
   * other; fractions are shown by default and dropped for round figures like
   * the cash-on-delivery ceiling.
   */
  const formatMoney = (value, fractionDigits = 2) => new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: merchant.currency || 'INR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);

  const codUnavailableMessage = () => {
    if (codSpecialBlocked) {
      return strings["Cash on delivery is not available for special offer products. Please pay online."]
        || "Cash on delivery is not available for special offer products. Please pay online.";
    }
    if (noDeliveryPostalCode) {
      return (strings["We do not deliver to postal code"] || "We do not deliver to postal code")
        + " " + noDeliveryPostalCode + ".";
    }
    if (!codPostalAllowed) {
      return (strings["Cash on delivery is not available for postal code"]
        || "Cash on delivery is not available for postal code")
        + " " + restrictedPostalCode + ".";
    }
    const amount = formatMoney(codMaxAmount, 0);
    return (strings["Cash on delivery is not available for orders of"]
      || "Cash on delivery is not available for orders of")
      + " " + amount + " " + (strings["or more"] || "or more") + ".";
  };

  /**
   * Loads Razorpay's hosted checkout script, once.
   *
   * Resolves false rather than throwing when it cannot load, so a blocked or
   * offline script turns into a message instead of a checkout that silently
   * does nothing when the button is pressed.
   */
  const loadRazorpayScript = () => new Promise(resolve => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  /**
   * Razorpay runs in two steps: the backend creates a Razorpay order, then the
   * shopper pays against it in Razorpay's own checkout. Only once that returns
   * a signed result is our order placed.
   *
   * The key id and the order id both come back from /payment/init rather than
   * from the browser's configuration, so the checkout is always opened against
   * the credentials that actually created the order -- switching the store
   * between test and live keys in Admin cannot leave the two out of step.
   */
  const onSubmitRazorpayOrder = async (data) => {
    if (!cartID) {
      history.push("/");
      return;
    }
    setLoader(true);

    const unavailable = strings["Online payment is not available right now"]
      || "Online payment is not available right now. Please try bank transfer or contact us.";

    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        setLoader(false);
        addToast(unavailable, { appearance: "error", autoDismiss: true });
        return;
      }

      const initAction = constant.ACTION.CART + cartID + '/payment/init'
        + '?store=' + defaultStore + '&lang=' + currentLanguageCode;

      const initResponse = await WebService.post(initAction, {
        "paymentType": "CREDITCARD",
        "transactionType": "INIT",
        "paymentModule": "razorpay",
        "amount": shippingQuote[shippingQuote.length - 1].value
      });

      const details = (initResponse && initResponse.transactionDetails) || {};
      const razorpayOrderId = details.razorpayOrderId;
      const razorpayKeyId = details.razorpayKeyId || window._env_.APP_RAZORPAY_KEY_ID;

      if (!razorpayOrderId || !razorpayKeyId) {
        console.error('Razorpay init did not return an order id', initResponse);
        setLoader(false);
        addToast(unavailable, { appearance: "error", autoDismiss: true });
        return;
      }

      const checkout = new window.Razorpay({
        key: razorpayKeyId,
        order_id: razorpayOrderId,
        name: (merchant && merchant.name) || 'Divine Shopee',
        description: strings["Order payment"] || "Order payment",
        prefill: {
          name: [data.firstName, data.lastName].filter(Boolean).join(' '),
          email: data.email,
          contact: data.phone || ''
        },
        theme: { color: window._env_.APP_THEME_COLOR || '#7f0000' },
        handler: (response) => {
          // Signed result: hand the three values to our backend to verify.
          onPayment(data, {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
        },
        modal: {
          /*
           * Closing the window is a normal thing to do -- UPI especially gets
           * abandoned often -- so the loader has to come off and the cart has
           * to survive. Nothing is placed: our order only exists once a signed
           * payment comes back.
           */
          ondismiss: () => {
            setLoader(false);
            addToast(strings["Payment was not completed"] || "Payment was not completed.",
              { appearance: "info", autoDismiss: true });
          }
        }
      });

      checkout.on('payment.failed', (response) => {
        console.error('Razorpay reported a failed payment', response && response.error);
        setLoader(false);
        addToast((response && response.error && response.error.description)
          || (strings["Payment failed"] || "Payment failed. Please try again."),
          { appearance: "error", autoDismiss: true });
      });

      checkout.open();

    } catch (error) {
      console.error('Razorpay payment could not be started', error);
      setLoader(false);
      addToast(unavailable, { appearance: "error", autoDismiss: true });
    }
  };

  const onSubmitOrder = async (data, elements, stripe) => {
    if (!cartID) {
      history.push("/");
      return;
    }
    setLoader(true)

    /*
     * Everything here can fail before the order is even attempted: Stripe.js
     * may not have loaded (a missing or rejected publishable key), and the card
     * element may not be mounted. Both used to throw out of an async click
     * handler with the page loader still on and nothing said, which reads as a
     * frozen checkout.
     */
    try {
      const card = elements ? elements.getElement(CardElement) : null;
      if (!stripe || !card) {
        setLoader(false);
        addToast(strings["Card payment is not available right now"]
          || "Card payment is not available right now. Please try cash on delivery or contact us.",
          { appearance: "error", autoDismiss: true });
        return;
      }

      const result = await stripe.createToken(card);
      if (result.error) {
        setLoader(false)
        addToast(result.error.message, { appearance: "error", autoDismiss: true });
        return;
      }
      onPayment(data, result.token.id)
    } catch (error) {
      console.error('Card payment could not be started', error);
      setLoader(false);
      addToast(strings["Card payment is not available right now"]
        || "Card payment is not available right now. Please try cash on delivery or contact us.",
        { appearance: "error", autoDismiss: true });
    }
  }

  /**
   * What to send as the order's payment.
   *
   * Cash on delivery has no gateway and no token: the order is placed and the
   * money is collected at the door, so the payload only names the module. Card
   * payments keep sending the Stripe token they always did.
   */
  const paymentPayload = (result) => {
    if (isBankTransfer) {
      return {
        "paymentType": "MONEYORDER",
        "transactionType": "AUTHORIZECAPTURE",
        "paymentModule": "moneyorder",
        "amount": shippingQuote[shippingQuote.length - 1].value
      };
    }
    if (isCashOnDelivery) {
      return {
        "paymentType": "COD",
        "transactionType": "AUTHORIZECAPTURE",
        "paymentModule": "cod",
        "amount": shippingQuote[shippingQuote.length - 1].value
      };
    }
    if (isRazorpay) {
      /*
       * Razorpay hands back three values that only mean anything together:
       * the payment id, the order id they belong to, and a signature over
       * both. paymentToken carries a single string, so they travel as JSON
       * and the backend populator unpacks them. The module refuses the
       * payment unless the signature verifies AND Razorpay's own API agrees
       * the payment is captured.
       */
      return {
        "paymentType": "CREDITCARD",
        "transactionType": "AUTHORIZECAPTURE",
        "paymentModule": "razorpay",
        "paymentToken": JSON.stringify(result || {}),
        "amount": shippingQuote[shippingQuote.length - 1].value
      };
    }
    return {
      "paymentType": "CREDITCARD",
      "transactionType": "CAPTURE",
      "paymentModule": "stripe",
      "paymentToken": result ? result.token : null,
      "amount": shippingQuote[shippingQuote.length - 1].value
    };
  };

  const onPayment = async (data, result) => {
    let action;

    // console.log(data);
    let param = {};
    if (userData) {
      action = constant.ACTION.AUTH + constant.ACTION.CART + cartID + '/' + constant.ACTION.CHECKOUT
        + '?store=' + defaultStore + '&lang=' + currentLanguageCode
      param = {
        "shippingQuote": selectedOptions,
        "currency": merchant.currency,
        "payment": paymentPayload(result)
      }
    } else {
      action = constant.ACTION.CART + cartID + '/' + constant.ACTION.CHECKOUT
        + '?store=' + defaultStore + '&lang=' + currentLanguageCode
      let customer = {};
      if (isShipping) {
        customer = {
          "emailAddress": data.email,
          "billing": {
            "address": data.address,
            // "company": data.company,
            "city": data.city,
            "postalCode": data.postalCode,
            "country": data.country,
            // "stateProvince": data.stateProvince,
            "zone": data.stateProvince,
            "firstName": data.firstName,
            "lastName": data.lastName,
            // "phone": data.phone
          },
          "delivery": {
            "address": data.shipAddress,
            // "company": data.shipCompany,
            "city": data.shipCity,
            "postalCode": data.shipPostalCode,
            "country": data.shipCountry,
            // "stateProvince": data.shipStateProvince,
            "zone": data.shipStateProvince,
            "firstName": data.shipFirstName,
            "lastName": data.shipLastName,
            // "phone": data.shipPhone
          }
        }
      } else {
        customer = {
          "emailAddress": data.email,
          "billing": {
            "address": data.address,
            // "company": data.company,
            "city": data.city,
            "postalCode": data.postalCode,
            "country": data.country,
            // "stateProvince": data.stateProvince,
            "zone": data.stateProvince,
            "firstName": data.firstName,
            "lastName": data.lastName,
            // "phone": data.phone
          }
        }
      }
      if (isAccount) {
        customer['password'] = data.password;
        customer['repeatPassword'] = data.repeatPassword;
      }
      param = {
        "shippingQuote": selectedOptions,
        "currency": merchant.currency,
        "payment": paymentPayload(result),
        "customer": customer
      }
    }
    // console.log(param);
    // 
    /*
     * Only the call itself decides whether the order failed. Everything that
     * follows -- clearing the form, the card element, the cart -- used to sit
     * inside the same try, so a slip there was reported as a failed order even
     * though the order had been placed. That is exactly what `ref.clear()` did
     * on cash on delivery: `ref` is set by the Stripe card element's onReady,
     * which is never rendered in COD mode, so it stayed null and the success
     * path threw.
     */
    let response;
    try {
      response = await WebService.post(action, param);
    } catch (error) {
      console.error('Order submission failed', error);
      const message = error && error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : null;
      if (isAccount && !message) {
        addToast("Registering customer already exist", { appearance: "error", autoDismiss: true });
      } else {
        addToast(message || "Your order submission has been failed", { appearance: "error", autoDismiss: true });
      }
      setLoader(false)
      return;
    }

    if (response) {
      reset({})
      if (ref) {
        /*
         * Stripe destroys the card element when its form unmounts -- switching
         * the payment method away from card does exactly that -- and this
         * reference outlives it, so clearing can throw "This Element has
         * already been destroyed".
         *
         * It is caught rather than prevented because the throw lands in the
         * worst possible place: the order has already been placed by this
         * point, and an exception here skipped emptying the cart and the
         * redirect to /order-confirm, leaving the shopper on the checkout page
         * reading an error for an order that went through. A card field that
         * is already gone needs no clearing.
         */
        try {
          ref.clear() // no card element to clear when paying cash on delivery
        } catch (error) {
          console.warn('Card element already gone, nothing to clear', error);
        }
      }
      deleteAllFromCart(response.id)
      setLocalData('order-email', data.email)
      // the confirmation page repeats the bank / UPI details for a bank transfer
      setLocalData('order-payment', isBankTransfer
        ? JSON.stringify({ method: 'MONEYORDER', details: bankTransfer.details })
        : JSON.stringify({ method: paymentMethod }))
      addToast("Your order has been submitted", { appearance: "success", autoDismiss: true });
      history.push('/order-confirm')
    }
    setLoader(false)

  }


  /**
   * react-hook-form simply does not call the submit handler when a field is
   * invalid, so pressing Place your order did nothing at all and the shopper
   * was left guessing -- especially when the offending field is off-screen.
   */
  const onInvalidSubmit = (formErrors) => {
    setLoader(false);
    addToast(strings["Please check the highlighted fields"]
      || "Please check the highlighted fields", { appearance: "error", autoDismiss: true });
    const firstInvalid = Object.keys(formErrors || {})[0];
    if (firstInvalid) {
      const field = document.querySelector(`[name="${firstInvalid}"]`);
      if (field && field.scrollIntoView) {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (field.focus) {
          field.focus();
        }
      }
    }
  };

  const onConfirmPassword = (e) => {
    if (watch('password') !== e.target.value) {
      return setError(
        paymentForm.repeatPassword.name,
        {
          type: "notMatch",
          message: "Repeat Password should be the same as a password"
        }
      );
    }

  }
  const onPasswordChange = (e) => {
    // console.log(e.target.value)
    // console.log(watch('repeatPassword'))
    if (watch('repeatPassword') !== '' && watch('repeatPassword') !== e.target.value) {
      return setError(
        paymentForm.repeatPassword.name,
        {
          type: "notMatch",
          message: "Repeat Password should be the same as a password"
        }
      );

    } else {
      clearErrors(paymentForm.repeatPassword.name);
    }

  }

  const onAgreement = async() => {
    let action = constant.ACTION.CONTENT + constant.ACTION.BOXES + constant.ACTION.AGREEMENT;
    try {
      let response = await WebService.get(action);
      if (response) {
        setAgreementData(response.description.description)
      }
    } catch (error) {
    }
  }

  function changeAddress() {
    var param = { 'postalCode': watch('postalCode'), 'countryCode': watch('country'), 'zoneCode': watch('stateProvince') }
    if (isShipping) {
     param = { 'postalCode': watch('shipPostalCode'), 'countryCode': watch('shipCountry'), 'zoneCode': watch('shipStateProvince')  }
    } 

    var p = '';
    if(p !== param) {

      p = param;
      //execute

       
       console.log('Required fields '+ JSON.stringify(param));
       unity(p);
  
    } else {
      return;
    }

  }

  var unity = (function() {
    var executed;
    if(executed) {
      return;
    }
    return function() {
            if (!executed) {
                executed = true;
                //if( param.postalCode == null && param.country == null && param.zoneCode == null) {
                //  return;
                //}
                var millisecondsToWait = 5000;
                setTimeout(function() {
                    // Whatever you want to do after the wait
                    console.log('Into execution');


                    executed = false;
                }, millisecondsToWait);
            } 
            return;
            /**
            console.log('The execution '+ executed);
            var millisecondsToWait = 5000;
            setTimeout(function() {
                // Whatever you want to do after the wait
                console.log('Into execution');
                executed = false;
            }, millisecondsToWait);
            // do something
            ?**/

    };
  })();
  
  return (
    <Fragment>
      <MetaTags>
        <title>{merchant.name} | {strings["Checkout"]}</title>
        {/* <meta
          name="description"
          content="Checkout page of flone react minimalist eCommerce template."
        /> */}
      </MetaTags>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + "/"}>{strings["Home"]}</BreadcrumbsItem>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + pathname}>
      {strings["Checkout"]}
      </BreadcrumbsItem>
      <Layout headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-2"
        headerTop="visible">
        {/* breadcrumb */}
        <Breadcrumb />
        <div className="checkout-area pt-95 pb-100">

          <div className="container">
            {

              isValidObject(cartItems) && cartItems.products.length > 0 && !userData &&
              <div className="checkout-heading">
                <Link to={"/login"}>{strings["Returning customer ? Click here to login"]}</Link>
              </div>

            }

            {isValidObject(cartItems) && cartItems.products.length > 0 ? (

              <form>
                <div className="row">
                  <div className="col-lg-6">
                    <div className="billing-info-wrap">
                      <h3>{strings["Billing Details"]}</h3>
                      <div className="row">

                        <div className="col-lg-6 col-md-6">
                          <div className="billing-info mb-20">
                            <label>{strings["First Name"]}</label>
                            <input type="text" name={paymentForm.firstName.name} ref={register(paymentForm.firstName.validate)} />
                            {errors[paymentForm.firstName.name] && <p className="error-msg">{errors[paymentForm.firstName.name].message}</p>}
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6">
                          <div className="billing-info mb-20">
                            <label>{strings["Last Name"]}</label>
                            <input type="text" name={paymentForm.lastName.name} ref={register(paymentForm.lastName.validate)} />
                            {errors[paymentForm.lastName.name] && <p className="error-msg">{errors[paymentForm.lastName.name].message}</p>}
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="billing-info mb-20">
                            <label>{strings["Company Name"]}</label>
                            <input type="text" name={paymentForm.company.name} ref={register(paymentForm.company.validate)} />
                          </div>
                        </div>

                        <div className="col-lg-12">
                          <div className="billing-info mb-20">
                            <label>{strings["Street Address"]}</label>
                            <Script
                              url={"https://maps.googleapis.com/maps/api/js?key=" + window._env_.APP_MAP_API_KEY + "&libraries=places"}
                              onLoad={handleScriptLoad}
                            />
                            <input
                              className="billing-address"
                              placeholder={strings["House number and street name"]}
                              type="text"
                              id="autocomplete"
                              name={paymentForm.address.name}
                              ref={register(paymentForm.address.validate)}
                            />
                            {errors[paymentForm.address.name] && <p className="error-msg">{errors[paymentForm.address.name].message}</p>}

                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="billing-select mb-20">
                            <label>{strings["Country"]}</label>

                            <Controller
                              name={paymentForm.country.name}
                              control={control}
                              rules={paymentForm.country.validate}
                              render={props => {
                                return (
                                  <select onChange={(e) => { props.onChange(e.target.value); getState(e.target.value); onChangeShipping() }} value={props.value}>
                                    <option>{strings["Select a country"]}</option>
                                    {

                                      shipCountryData.map((data, i) => {
                                       //getShippingCountry(currentLanguageCode).map((data, i) => {
                                        // shipCountryData.map((data, i) => {
                                      
                                        return <option key={i} value={data.code}>{data.name}</option>
                                      })
                                    }
                                  </select>
                                )
                              }}
                            />

                            {errors[paymentForm.country.name] && <p className="error-msg">{errors[paymentForm.country.name].message}</p>}
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="billing-info mb-20">
                            <label>{strings["Town/City"]}</label>
                            <input type="text" name={paymentForm.city.name} ref={register(paymentForm.city.validate)} />
                            {errors[paymentForm.city.name] && <p className="error-msg">{errors[paymentForm.city.name].message}</p>}
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6">
                          <div className="billing-select mb-20">
                            <label>{strings["State"]}</label>
                            {
                              stateData && stateData.length > 0 ?
                                <Controller
                                  name={paymentForm.stateProvince.name}
                                  control={control}
                                  rules={paymentForm.stateProvince.validate}
                                  render={props => {
                                    return (
                                      <select onBlur={changeAddress()} onChange={(e) => props.onChange(e.target.value)} value={props.value}>
                                        <option>{strings["State / province"]}</option>
                                        {
                                          stateData.map((data, i) => {
                                            return <option key={i} value={data.code}>{data.name}</option>
                                          })
                                        }
                                      </select>)
                                  }}
                                />
                                :
                                <input type="text" name={paymentForm.stateProvince.name} ref={register(paymentForm.stateProvince.validate)} />
                            }
                            {errors[paymentForm.stateProvince.name] && <p className="error-msg">{errors[paymentForm.stateProvince.name].message}</p>}

                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6">
                          <div className="billing-info mb-20">
                            <label>{strings["Postcode"]}</label>
                            <input type="text" name={paymentForm.postalCode.name} ref={register(paymentForm.postalCode.validate)} onChange={() => {

                              clearTimeout(timer);
                              setTimer(setTimeout(function () {
                                onChangeShipping()
                              }, 500))
                            }} />
                            {errors[paymentForm.postalCode.name] && <p className="error-msg">{errors[paymentForm.postalCode.name].message}</p>}
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6">
                          <div className="billing-info mb-20">
                            <label>{strings["Phone"]}</label>
                            <input type="text" name={paymentForm.phone.name} ref={register(paymentForm.phone.validate)} />
                            {errors[paymentForm.phone.name] && <p className="error-msg">{errors[paymentForm.phone.name].message}</p>}
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-6">
                          <div className="billing-info mb-20">
                            <label>{strings["Email address"]}</label>
                            <input type="text" name={paymentForm.email.name} ref={register(paymentForm.email.validate)} />
                            {errors[paymentForm.email.name] && <p className="error-msg">{errors[paymentForm.email.name].message}</p>}
                          </div>
                        </div>
                      </div>
                      {
                        !userData &&
                        <div className="login-toggle-btn">
                          <input type="checkbox" value={isAccount} onChange={() => setIsAccount(!isAccount)} />
                          <label className="ml-10 mb-20">{strings["Create an account"]}</label>
                        </div>
                      }
                      {
                        isAccount &&
                        <div>
                          <p className="main-color"> Create an account by entering the information below.If you are a returning customer please login using the link at the top of the page.</p>
                          <div className="col-lg-12">
                            <div className="billing-info mb-20">
                              <label>Account Password</label>
                              <input type="password" name={paymentForm.password.name} ref={register(paymentForm.password.validate)} onChange={(e) => onPasswordChange(e)} />
                              {errors[paymentForm.password.name] && <p className="error-msg">{errors[paymentForm.password.name].message}</p>}
                            </div>
                          </div>
                          <div className="col-lg-12">
                            <div className="billing-info mb-20">
                              <label>Repeat Account Password</label>
                              <input type="password" name={paymentForm.repeatPassword.name} ref={register(paymentForm.repeatPassword.validate)} onChange={(e) => onConfirmPassword(e)} />
                              {errors[paymentForm.repeatPassword.name] && <p className="error-msg">{errors[paymentForm.repeatPassword.name].message}</p>}
                            </div>
                          </div>
                        </div>
                      }
                      <div className="login-toggle-btn">
                        <input type="checkbox" value={isShipping} onChange={onChangeShipAddress} />
                        <label className="ml-10 mb-20">{strings["SHIP TO A DIFFERENT ADDRESS?"]}</label>
                      </div>
                      {
                        isShipping &&
                        <div className="billing-info-wrap">
                          <h3>{strings["Shipping Details"]}</h3>
                          <div className="row">

                            <div className="col-lg-6 col-md-6">
                              <div className="billing-info mb-20">
                                <label>{strings["First Name"]}</label>
                                <input type="text" name={paymentForm.shipFirstName.name} ref={register(paymentForm.shipFirstName.validate)} />
                                {errors[paymentForm.shipFirstName.name] && <p className="error-msg">{errors[paymentForm.shipFirstName.name].message}</p>}
                              </div>
                            </div>
                            <div className="col-lg-6 col-md-6">
                              <div className="billing-info mb-20">
                                <label>{strings["Last Name"]}</label>
                                <input type="text" name={paymentForm.shipLastName.name} ref={register(paymentForm.shipLastName.validate)} />
                                {errors[paymentForm.shipLastName.name] && <p className="error-msg">{errors[paymentForm.shipLastName.name].message}</p>}
                              </div>
                            </div>
                            <div className="col-lg-12">
                              <div className="billing-info mb-20">
                                <label>{strings["Company Name"]}</label>
                                <input type="text" name={paymentForm.shipCompany.name} ref={register(paymentForm.shipCompany.validate)} />
                              </div>
                            </div>

                            <div className="col-lg-12">
                              <div className="billing-info mb-20">
                                <label>{strings["Street Address"]}</label>
                                <input
                                  className="billing-address"
                                  placeholder={strings["House number and street name"]}
                                  type="text"
                                  name={paymentForm.shipAddress.name}
                                  ref={register(paymentForm.shipAddress.validate)}
                                />
                                {errors[paymentForm.shipAddress.name] && <p className="error-msg">{errors[paymentForm.shipAddress.name].message}</p>}

                              </div>
                            </div>
                            <div className="col-lg-12">
                              <div className="billing-select mb-20">
                                <label>{strings["Country"]}</label>

                                <Controller
                                  name={paymentForm.shipCountry.name}
                                  control={control}
                                  rules={paymentForm.shipCountry.validate}
                                  render={props => {
                                    return (
                                      <select onChange={(e) => { props.onChange(e.target.value); getShippingState(e.target.value); onChangeShipping() }} value={props.value}>
                                        <option>{strings["Select a country"]}</option>
                                        {

                                          shipCountryData.map((data, i) => {
                                            return <option key={i} value={data.code}>{data.name}</option>
                                          })
                                        }
                                      </select>
                                    )
                                  }}
                                />

                                {errors[paymentForm.shipCountry.name] && <p className="error-msg">{errors[paymentForm.shipCountry.name].message}</p>}
                              </div>
                            </div>
                            <div className="col-lg-12">
                              <div className="billing-info mb-20">
                                <label>{strings["Town/City"]}</label>
                                <input type="text" name={paymentForm.shipCity.name} ref={register(paymentForm.shipCity.validate)} />
                                {errors[paymentForm.shipCity.name] && <p className="error-msg">{errors[paymentForm.shipCity.name].message}</p>}
                              </div>
                            </div>
                            <div className="col-lg-6 col-md-6">
                              <div className="billing-select mb-20">
                                <label>{strings["State"]}</label>
                                {
                                  shipStateData && shipStateData.length > 0 ?
                                    <Controller
                                      name={paymentForm.shipStateProvince.name}
                                      control={control}
                                      rules={paymentForm.shipStateProvince.validate}
                                      render={props => {
                                        return (
                                          <select onChange={(a) => console.log('-----'+a)} value={props.value}>
                                            <option>{strings["State / Province"]}</option>
                                            {
                                              shipStateData.map((data, i) => {
                                                return <option key={i} value={data.code}>{data.name}</option>
                                              })
                                            }
                                          </select>)
                                      }}
                                    />
                                    :
                                    <input type="text" name={paymentForm.shipStateProvince.name} ref={register(paymentForm.shipStateProvince.validate)} />
                                }
                                {errors[paymentForm.shipStateProvince.name] && <p className="error-msg">{errors[paymentForm.shipStateProvince.name].message}</p>}

                              </div>
                            </div>
                            <div className="col-lg-6 col-md-6">
                              <div className="billing-info mb-20">
                                <label>{strings["Postcode"]}</label>
                                <input type="text" name={paymentForm.shipPostalCode.name} ref={register(paymentForm.shipPostalCode.validate)} onChange={() => {
                                  clearTimeout(timer);
                                  setTimer(setTimeout(function () {
                                    onChangeShipping()
                                  }, 500))
                                }} />
                                {errors[paymentForm.shipPostalCode.name] && <p className="error-msg">{errors[paymentForm.shipPostalCode.name].message}</p>}
                              </div>
                            </div>
                            {/* <div className="col-lg-6 col-md-6">
                              <div className="billing-info mb-20">
                                <label>Phone</label>
                                <input type="text" name={paymentForm.shipPhone.name} ref={register(paymentForm.shipPhone.validate)} />
                                {errors[paymentForm.shipPhone.name] && <p className="error-msg">{errors[paymentForm.shipPhone.name].message}</p>}
                              </div>
                            </div>
                            <div className="col-lg-6 col-md-6">
                              <div className="billing-info mb-20">
                                <label>Email Address</label>
                                <input type="text" name={paymentForm.shipEmail.name} ref={register(paymentForm.shipEmail.validate)} />
                                {errors[paymentForm.shipEmail.name] && <p className="error-msg">{errors[paymentForm.shipEmail.name].message}</p>}
                              </div>
                            </div> */}
                          </div>
                        </div>
                      }
                      <div className="additional-info-wrap">
                        <h4>{strings["Additional information"]}</h4>
                        <div className="additional-info">
                          <label>{strings["Order notes"]}</label>
                          <textarea
                            placeholder={strings["Notes about your order, e.g. special notes for delivery."]}
                            name="message"
                            defaultValue={""}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="your-order-area">
                      <h3>{strings["Your order"]}</h3>
                      <div className="your-order-wrap gray-bg-4">
                        <div className="your-order-product-info">
                          <div className="your-order-top">
                            <ul>
                              <li>{strings["Product"]}</li>
                              <li>{strings["Total"]}</li>
                            </ul>
                          </div>
                          <div className="your-order-middle">
                            <ul>
                              {cartItems.products.map((cartItem, key) => {

                                return (
                                  <li key={key}>
                                    <span className="order-middle-left" style={{ width: 220 }}>
                                      {cartItem.description.name}
                                    </span>{" "}
                                    <span>X {cartItem.quantity}</span>
                                    <span className="order-price">
                                      {
                                        cartItem.finalPrice
                                      }
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                          <div className="your-order-sub-total">
                            {
                              shippingQuote.length > 0 &&
                              shippingQuote.map((quote, i) => {
                                return (
                                  quote.title !== 'Total' &&
                                  <ul className="mb-20" key={i}>
                                    <li className="order-total">{quote.title}</li>
                                    <li>
                                      {quote.total}
                                    </li>
                                  </ul>)
                              })
                            }

                          </div>
                          {
                            config.displayShipping && shippingOptions &&
                          <div className="your-order-bottom">
                            <div className="shippingRow">
                              <ul><li className="your-order-shipping">Shipping</li></ul>
                              <ul>
                                {shippingOptions.map((value, i) => (
                                  <li key={i}>
                                    <div className="login-toggle-btn">
                                      <input
                                        type="radio"
                                        value={value.shippingQuoteOptionId}
                                        onChange={() => { setSelectedOptions(value.shippingQuoteOptionId); shippingQuoteChange(value.shippingQuoteOptionId); }}
                                        checked={selectedOptions === value.shippingQuoteOptionId}
                                      />
                                      <label className="ml-10 mb-20">{value.optionName} — {value.optionPriceText}</label>
                                    </div>
                                    {value.note && selectedOptions === value.shippingQuoteOptionId && (
                                      <p style={{ fontSize: 12, color: 'grey', marginLeft: 24, marginTop: 4 }}>{value.note}</p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          }
                          <div className="your-order-total">
                            <ul>
                              <li className="order-total">Total</li>
                              <li>
                                {
                                  shippingQuote.length > 0 &&
                                  shippingQuote.map((quote, i) => {
                                    return quote.title === 'Total' && quote.total
                                  })
                                }
                                {/* {cartItems.displayTotal} */}
                              </li>
                            </ul>
                          </div>
                        </div>

                      </div>
                      {
                        // one way to pay needs no choosing; the block below it
                        // is the method itself
                        enabledPayments.length > 1 &&
                        <div className="payment-method-choice mt-25">
                          <h5>{strings["Payment method"] || "Payment method"}</h5>
                          <ul>
                            {availablePayments.map(method => (
                              <li key={method}>
                                <div className="login-toggle-btn">
                                  <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={method}
                                    checked={paymentMethod === method}
                                    onChange={() => setPaymentMethod(method)}
                                  />
                                  <label className="ml-10 mb-20">
                                    {method === 'COD'
                                      ? (strings["Cash on delivery"] || "Cash on delivery")
                                      : method === 'MONEYORDER'
                                        ? (strings["Bank transfer / UPI"] || "Bank transfer / UPI")
                                        : method === 'RAZORPAY'
                                          ? (strings["Card / UPI / Netbanking"] || "Card / UPI / Netbanking")
                                          : (strings["Credit card"] || "Credit card")}
                                    {/* the fee is part of choosing this, so it is said here
                                        rather than appearing in the total afterwards */}
                                    {method === 'COD' && codFeeInfo.fee > 0 &&
                                      <span className="payment-method-fee">
                                        {" "}(+{formatMoney(codFeeInfo.fee)}{" "}
                                        {strings["convenience fee"] || "convenience fee"})
                                      </span>
                                    }
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                          {
                            // say why, rather than quietly dropping the option
                            enabledPayments.indexOf('COD') !== -1 && !codAvailable &&
                            <p className="payment-method-note">{codUnavailableMessage()}</p>
                          }
                        </div>
                      }
                      {
                        isBankTransfer &&
                        <div className="payment-method mt-25">
                          <div className="cod-info bank-transfer-info">
                            <h5>{strings["Bank transfer / UPI"] || "Bank transfer / UPI"}</h5>
                            <p>{strings["Place your order now and pay by bank transfer or UPI. We ship once your payment is received."]
                              || "Place your order now and pay by bank transfer or UPI. We ship once your payment is received."}</p>
                            {bankTransfer.details ? (
                              <div className="bank-transfer-details" dangerouslySetInnerHTML={{ __html: bankTransfer.details }} />
                            ) : (
                              <p>{strings["We will send our bank and UPI details to your email after you place the order."]
                                || "We will send our bank and UPI details to your email after you place the order."}</p>
                            )}
                            <p className="bank-transfer-note">{strings["Please mention your order number as the payment reference."]
                              || "Please mention your order number as the payment reference."}</p>
                          </div>
                          <div className="place-order mt-100">
                            <div className="login-toggle-btn mb-20">
                              <input type="checkbox" name={paymentForm.isAgree.name} ref={register(paymentForm.isAgree.validate)} onChange={onAgreement}/>
                              <label className="ml-10 ">{strings["I agree with the terms and conditions"]}</label>
                              {errors[paymentForm.isAgree.name] && <p className="error-msg">{errors[paymentForm.isAgree.name].message}</p>}
                            </div>
                            <div>
                              {
                                watch('isAgree') &&
                                <div className="agreement-info-wrap" dangerouslySetInnerHTML={{ __html: agreementData.replace(/>]]/g, "&gt;") }}>
                                </div>
                              }
                            </div>
                            <button type="button" onClick={handleSubmit((d) => onSubmitCodOrder(d), onInvalidSubmit)} className="btn-hover">{strings["Place your order"]}</button>
                          </div>
                        </div>
                      }
                      {
                        isCashOnDelivery &&
                        <div className="payment-method mt-25">
                          <div className="cod-info">
                            <h5>{strings["Cash on delivery"] || "Cash on delivery"}</h5>
                            <p>{strings["Pay in cash when your order is delivered"] || "Pay in cash when your order is delivered."}</p>
                          </div>
                          <div className="place-order mt-100">
                            <div className="login-toggle-btn mb-20">
                              <input type="checkbox" name={paymentForm.isAgree.name} ref={register(paymentForm.isAgree.validate)} onChange={onAgreement}/>
                              <label className="ml-10 ">{strings["I agree with the terms and conditions"]}</label>
                              {errors[paymentForm.isAgree.name] && <p className="error-msg">{errors[paymentForm.isAgree.name].message}</p>}
                            </div>
                            <div>
                              {
                                watch('isAgree') &&
                                <div className="agreement-info-wrap" dangerouslySetInnerHTML={{ __html: agreementData.replace(/>]]/g, "&gt;") }}>
                                </div>
                              }
                            </div>
                            <button type="button" onClick={handleSubmit((d) => onSubmitCodOrder(d), onInvalidSubmit)} className="btn-hover">{strings["Place your order"]}</button>
                          </div>
                        </div>
                      }
                      {
                        isRazorpay &&
                        <div className="payment-method mt-25">
                          {/*
                            No card fields here on purpose: Razorpay collects
                            them in its own window, which is what keeps card
                            data off this page and runs the OTP step RBI
                            requires on Indian card payments.
                          */}
                          <div className="cod-info">
                            <p>{strings["You will be taken to Razorpay to pay by UPI, card, netbanking or wallet."]
                              || "You will be taken to Razorpay to pay by UPI, card, netbanking or wallet."}</p>
                          </div>
                          <div className="place-order mt-100">
                            <div className="login-toggle-btn mb-20">
                              <input type="checkbox" name={paymentForm.isAgree.name} ref={register(paymentForm.isAgree.validate)} onChange={onAgreement}/>
                              <label className="ml-10 ">{strings["I agree with the terms and conditions"]}</label>
                              {errors[paymentForm.isAgree.name] && <p className="error-msg">{errors[paymentForm.isAgree.name].message}</p>}
                            </div>
                            <div>
                              {
                                watch('isAgree') &&
                                <div className="agreement-info-wrap" dangerouslySetInnerHTML={{ __html: agreementData.replace(/>]]/g, "&gt;") }}>
                                </div>
                              }
                            </div>
                            <button type="button" onClick={handleSubmit((d) => onSubmitRazorpayOrder(d), onInvalidSubmit)} className="btn-hover">{strings["Place your order"]}</button>
                          </div>
                        </div>
                      }
                      {
                        paymentMethod === 'STRIPE' &&
                        <div className="payment-method mt-25">
                          <Elements stripe={stripePromise} 
                            options={{locale: currentLanguageCode}}
                          >
                            <ElementsConsumer>
                              {({ stripe, elements }) => (
                                <>
                                  <div className="card-info">
                                    <CardElement options={CARD_ELEMENT_OPTIONS} stripe={stripe} onReady={e => setRef(e)} />
                                  </div>
                                  <div className="icon-container">
                                    <i className="fa fa-cc-visa" style={{ color: 'navy' }}></i>
                                    <i className="fa fa-cc-amex" style={{ color: 'blue' }}></i>
                                    <i className="fa fa-cc-mastercard" style={{ color: 'red' }}></i>
                                  </div>

                                  <div className="place-order mt-100">
                                    <div className="login-toggle-btn mb-20">
                                      <input type="checkbox" name={paymentForm.isAgree.name} ref={register(paymentForm.isAgree.validate)} onChange={onAgreement}/>
                                      <label className="ml-10 ">{strings["I agree with the terms and conditions"]}</label>
                                      {errors[paymentForm.isAgree.name] && <p className="error-msg">{errors[paymentForm.isAgree.name].message}</p>}
                                    </div>
                                    <div>
                                      {
                                          watch('isAgree') && 
                                          <div className="agreement-info-wrap" dangerouslySetInnerHTML={{ __html: agreementData.replace(/>]]/g, "&gt;") }}>
                                            {/* <textarea
                                              readOnly={true}
                                              name="message"
                                              defaultValue={() => renderAgreementText(agreementData)}
                                            /> */}
                                          </div>
                                      }
                                    
                                    </div>
                                    <button type="button" onClick={handleSubmit((d) => onSubmitOrder(d, elements, stripe), onInvalidSubmit)} className="btn-hover">{strings["Place your order"]}</button>
                                  </div>
                                </>
                              )}
                            </ElementsConsumer>
                          </Elements>
                        </div>
                      }
                      {
                        paymentMethod === 'NUVEI' &&
                        <iframe title="Payment Page" height={"1150"} width="570" srcDoc='<form action="https://testpayments.nuvei.com/merchant/paymentpage" method="post">
                        <input type="hidden" name="TERMINALID" value="" />
                        <input type="hidden" name="ORDERID" value="" />
                        <input type="hidden" name="CURRENCY" value="" />
                        <input type="hidden" name="AMOUNT" value="" />
                        <input type="hidden" name="DATETIME" value="22-01-2021:10:43:01:200" />
                        <input type="hidden" name="HASH" value="8636622c1dd4039783cd0fbcffd53a6ce2ceab7d0e183e8ce1b8043e3cdedebe3b6665c5e87d3b268e85217f6c11f15f09f86764d82b0bd923c8c19e9209296d" />
                        
                        <button type="submit"  style="font-weight: 500;
                        line-height: 1;
                        z-index: 9;
                        display: block;
                        width: 100%;
                        padding: 18px 20px;
                        text-align: center;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        color: #fff;
                        border: none;
                        border-radius: 50px;
                        background: none;
                        background-color: #fb799c;"className="btn-hover">Pay now</button>
                      </form>'></iframe>
                      }
                          </div>
                  </div>

                </div>
              </form>
            ) : (
                !isLoading && <div className="row">
                  <div className="col-lg-12">
                    <div className="item-empty-area text-center">
                      <div className="item-empty-area__icon mb-30">
                        <i className="pe-7s-cash"></i>
                      </div>
                      <div className="item-empty-area__text">
                      {strings["No items found in checkout"]} <br />{" "}
                        <Link to={"/"}>
                        {strings["Shop now"]}
                      </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </Layout>
    </Fragment>
  );
};

Checkout.propTypes = {
  cartItems: PropTypes.object,
  // currency: PropTypes.object,
  location: PropTypes.object,
  //currentLanguageCode: PropTypes.string
};

const mapStateToProps = state => {
  return {
    cartID: state.cartData.cartID,
    // countryData: state.userData.country,
    shipCountryData: state.userData.shipCountry,
    stateData: state.userData.state,
    shipStateData: state.userData.shipState,
    currentLocation: state.userData.currentAddress,
    userData: state.userData.userData,
    defaultStore: state.merchantData.defaultStore,
    merchant: state.merchantData.merchant,
    isLoading: state.loading.isLoading,
    currentLanguageCode: state.multilanguage.currentLanguageCode,
    // currency: state.currencyData
  };
};
const mapDispatchToProps = dispatch => {
  return {
    setLoader: (value) => {
      dispatch(setLoader(value));
    },
    getShippingCountry: (value) => {
      dispatch(getShippingCountry(value));
    },
    getState: (code) => {//state
      dispatch(getState(code));
    },
    getShippingState: (code) => {
      dispatch(getShippingState(code));
    },
    // left undispatched, so a placed order neither emptied the cart nor handed
    // the order number to the confirmation page
    deleteAllFromCart: (orderID) => {
      dispatch(deleteAllFromCart(orderID));
    },
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(multilanguage(Checkout));
