import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { multilanguage } from "redux-multilanguage";
import { connect } from "react-redux";

/**
 * Left-hand footer column: logo, one-line brand statement, and the two direct
 * contact routes. Replaces the theme's FooterCopyright, whose "Copyright (c)
 * ... All Rights Reserved" line now lives in the orange bar at the very bottom
 * of Footer.js, matching divineshopee.com.
 *
 * Everything here comes from the MERCHANT_STORE record rather than being
 * hard-coded: divineshopee.com is the US entity (+1 phone, New Jersey office)
 * while this build is the India store, so copying its contact block verbatim
 * would have shipped the wrong details.
 */
const FooterBrand = ({ spaceBottomClass, merchant, strings }) => {
  const logo = merchant && merchant.logo ? merchant.logo.path : null;
  return (
    <div className={`footer-brand ${spaceBottomClass ? spaceBottomClass : ""}`}>
      {logo && (
        <div className="footer-brand__logo">
          <Link to={process.env.PUBLIC_URL + "/"}>
            <img alt={merchant.name} src={logo} />
          </Link>
        </div>
      )}
      <p className="footer-brand__blurb">{strings["Brand statement"]}</p>
      {merchant && (
        <ul className="footer-brand__contact">
          {merchant.phone && (
            <li>
              <a href={`tel:${merchant.phone}`}>
                <i className="fa fa-phone" /> {merchant.phone}
              </a>
            </li>
          )}
          {merchant.email && (
            <li>
              <a href={`mailto:${merchant.email}`}>
                <i className="fa fa-envelope" /> {merchant.email}
              </a>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

FooterBrand.propTypes = {
  spaceBottomClass: PropTypes.string,
  merchant: PropTypes.object,
  strings: PropTypes.object
};

const mapStateToProps = state => ({ merchant: state.merchantData.merchant });

export default connect(mapStateToProps)(multilanguage(FooterBrand));
