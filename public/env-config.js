window._env_ = {
  APP_PRODUCTION: "false",
  APP_BASE_URL: "http://localhost:8080",
  APP_API_VERSION: "/api/v1/",
  APP_MERCHANT: "divineStore",
  APP_PRODUCT_GRID_LIMIT: "15",
  APP_MAP_API_KEY: "",
  APP_NUVEI_TERMINAL_ID: "",
  APP_NUVEI_SECRET: "",
  // Canonical origin for <link rel="canonical"> and absolute SEO URLs. Must be
  // the host the pages are really served from -- apex and www are different
  // sites to a crawler. Blank falls back to https://divineshopee.in.
  APP_SITE_URL: "https://divineshopee.in",
  APP_PAYMENT_TYPE: "MONEYORDER,RAZORPAY,COD",
  // Cash on delivery is offered only below this amount, and carries a
  // convenience fee of 10% of the order with a floor of 50 (both enforced
  // server side -- CODPayment for the ceiling, CodConvenienceFee for the fee).
  // It is a ceiling, not a switch, and zero means "no ceiling" rather than
  // "off", so COD is withdrawn by dropping it from APP_PAYMENT_TYPE above and
  // disabling the cod module in the admin -- never by setting this to 0.
  // COD is listed last above so it is never the pre-selected method: the fee
  // should be something the shopper opts into, not a default they miss.
  APP_COD_MAX_AMOUNT: "2000",
  // Razorpay key id. Public by design -- the hosted checkout needs it in the
  // browser -- and only a fallback: /payment/init returns the key that made
  // the order, so the two can never disagree. The key secret is NEVER here;
  // it lives encrypted in the database, set from Admin > Payment > razorpay.
  APP_RAZORPAY_KEY_ID: "",
  // Stripe is no longer offered (see APP_PAYMENT_TYPE). Left blank rather than
  // removed so a store that re-enables STRIPE has somewhere to put its key.
  APP_STRIPE_KEY: "",
  APP_THEME_COLOR: "#7f0000",
  APP_BEAD_SIZE_UNIT: "mm",
  APP_BEAD_WEIGHT_UNIT: "g",
}
