import PropTypes from "prop-types";
import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import MetaTags from "react-meta-tags";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import Layout from "../../layouts/Layout";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { connect } from "react-redux";
import { multilanguage } from "redux-multilanguage";
import { getLocalData } from "../../util/helper";
const OrderConfirm = ({ location, orderID, strings, merchant }) => {
  const { pathname } = location;
  // how the order was paid, saved by the checkout; a bank transfer / UPI order
  // still has to be paid, so the details are repeated here with the order id
  const payment = (() => {
    try {
      return JSON.parse(getLocalData('order-payment') || '{}') || {};
    } catch (e) {
      return {};
    }
  })();
  const payByBankTransfer = payment.method === 'MONEYORDER';

  return (
    <Fragment>
      <MetaTags>
        <title>{merchant.name} | {strings["Order Confirm"]}</title>
        {/* <meta
          name="description"
          content="404 page of flone react minimalist eCommerce template."
        /> */}
      </MetaTags>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + "/"}>{strings["Home"]}</BreadcrumbsItem>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + pathname}>
        {strings["Order Confirm"]}
      </BreadcrumbsItem>
      <Layout headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-2"
        headerTop="visible">
        {/* breadcrumb */}
        <Breadcrumb />
        <div className="error-area pt-40 pb-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-7 col-lg-8 text-center">
                <div className="error">
                  <h3>{strings["Order Completed"]}</h3>
                  <h2>{strings["Thank you for ordering from"]} {merchant.name}</h2>
                  <p>
                    {strings["Your order id is"]} <b>{orderID}</b> <br />{strings["An email with you order details has been sent to"]} {getLocalData('order-email')}
                  </p>
                  {payByBankTransfer && (
                    <div className="bank-transfer-info text-left">
                      <h4>{strings["Complete your payment"] || "Complete your payment"}</h4>
                      <p>{strings["Please pay by bank transfer or UPI and mention your order id as the payment reference. We ship once your payment is received."]
                        || "Please pay by bank transfer or UPI and mention your order id as the payment reference. We ship once your payment is received."}</p>
                      {payment.details ? (
                        <div className="bank-transfer-details" dangerouslySetInnerHTML={{ __html: payment.details }} />
                      ) : (
                        <p>{strings["We will send our bank and UPI details to your email shortly."]
                          || "We will send our bank and UPI details to your email shortly."}</p>
                      )}
                    </div>
                  )}
                  <p>
                    {strings["Feedback"]}
                  </p>
                  <Link to={"/"} className="error-btn">
                    {strings["Shop Now"]}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </Fragment>
  );
};

OrderConfirm.propTypes = {
  location: PropTypes.object
};

const mapStateToProps = state => {
  return {
    orderID: state.cartData.orderID,
    merchant: state.merchantData.merchant
  };
};
export default connect(mapStateToProps, null)(multilanguage(OrderConfirm));
// export default OrderConfirm;
