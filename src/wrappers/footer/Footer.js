import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { animateScroll } from "react-scroll";
import FooterBrand from "../../components/footer/FooterBrand";
import FooterNewsletter from "../../components/footer/FooterNewsletter";
import { multilanguage } from "redux-multilanguage";
import { connect } from "react-redux";

/**
 * Footer aligned to divineshopee.com: a black band carrying three columns
 * (brand / Useful Links / registered office + subscribe) above a solid orange
 * strip holding the rights line.
 *
 * The five policy links point at Shopizer's CMS route (/content/{slug}) and
 * deliberately reuse the slugs already published on divineshopee.com, the same
 * convention the product and category migration followed, so inbound links and
 * search rankings survive the move. CONTENT is currently empty, so those pages
 * still have to be created in the admin before the links resolve.
 */
const USEFUL_LINKS = [
  { key: "About us", to: "/content/about-us" },
  { key: "Privacy Policy", to: "/content/privacy-policy-page" },
  { key: "Terms & Conditions", to: "/content/terms-conditions" },
  { key: "Disclaimer", to: "/content/disc" },
  // The storefront has a real contact form at /contact, which beats a static
  // CMS page, so this one link diverges from the source site's /contact-us/.
  { key: "Contact us", to: "/contact" },
  { key: "Latest Blogs", to: "/content/blog-feed" }
];

const Footer = ({
  backgroundColorClass,
  spaceTopClass,
  spaceBottomClass,
  spaceLeftClass,
  spaceRightClass,
  containerClass,
  extraFooterClass,
  sideMenu,
  merchant,
  strings
}) => {
  const [scroll, setScroll] = useState(0);
  const [top, setTop] = useState(0);

  useEffect(() => {
    setTop(100);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    animateScroll.scrollToTop();
  };

  const handleScroll = () => {
    setScroll(window.scrollY);
  };

  const address = merchant && merchant.address;

  return (
    <footer
      className={`footer-area footer-brand-area ${
        backgroundColorClass ? backgroundColorClass : ""
        } ${spaceTopClass ? spaceTopClass : ""} ${
        spaceBottomClass ? spaceBottomClass : ""
        } ${extraFooterClass ? extraFooterClass : ""} ${
        spaceLeftClass ? spaceLeftClass : ""
        } ${spaceRightClass ? spaceRightClass : ""}`}
    >
      <div className="footer-brand-area__main">
        <div className={`${containerClass ? containerClass : "container"}`}>
          <div className="row">
            <div className={sideMenu ? "col-xl-4 col-md-6" : "col-lg-4 col-md-6"}>
              <FooterBrand spaceBottomClass="mb-30" />
            </div>

            <div className={sideMenu ? "col-xl-4 col-md-6" : "col-lg-4 col-md-6"}>
              <div className="footer-widget mb-30">
                <div className="footer-title">
                  <h3>{strings["Useful Links"]}</h3>
                </div>
                <div className="footer-list">
                  <ul>
                    {USEFUL_LINKS.map(link => (
                      <li key={link.to}>
                        <Link to={link.to}>{strings[link.key]}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className={sideMenu ? "col-xl-4 col-md-6" : "col-lg-4 col-md-6"}>
              {address && (
                <div className="footer-widget footer-office mb-30">
                  <p>
                    <strong>{strings["Registered Office"]}:</strong>{" "}
                    {address.address}, {address.city}, {address.stateProvince}{" "}
                    {address.postalCode}
                  </p>
                </div>
              )}
              {/* footer newsletter */}
              <FooterNewsletter
                strings={strings}
                spaceBottomClass="mb-30"
                sideMenu={sideMenu}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="footer-brand-area__rights">
        <div className={`${containerClass ? containerClass : "container"}`}>
          <p>
            {strings["All rights reserved by"]}{" "}
            <Link to={process.env.PUBLIC_URL + "/"}>@divineshopee</Link>
          </p>
        </div>
      </div>

      <button
        className={`scroll-top ${scroll > top ? "show" : ""}`}
        onClick={() => scrollToTop()}
      >
        <i className="fa fa-angle-double-up"></i>
      </button>
    </footer>
  );
};

Footer.propTypes = {
  backgroundColorClass: PropTypes.string,
  containerClass: PropTypes.string,
  extraFooterClass: PropTypes.string,
  sideMenu: PropTypes.bool,
  spaceBottomClass: PropTypes.string,
  spaceLeftClass: PropTypes.string,
  spaceRightClass: PropTypes.string,
  spaceTopClass: PropTypes.string,
  merchant: PropTypes.object,
  strings: PropTypes.object
};

const mapStateToProps = state => ({ merchant: state.merchantData.merchant });

export default connect(mapStateToProps)(multilanguage(Footer));
