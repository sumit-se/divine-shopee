import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";

const FREE_SHIPPING_THRESHOLD = "₹5,000";

const DEFAULT_MEMBER_MESSAGE =
  "Member Exclusive Pricing Available — Log in to save 5% on selected products!";

const AnnouncementBar = ({ userData, merchant }) => {
  const raw =
    merchant && merchant.memberDiscountMessage
      ? merchant.memberDiscountMessage
      : DEFAULT_MEMBER_MESSAGE;

  // Split on newlines, filter blank lines
  const messages = raw
    .split("\n")
    .map(m => m.trim())
    .filter(Boolean);

  // Build the scrolling track: duplicate for seamless loop
  const track = [...messages, ...messages];

  return (
    <div className="announcement-bar announcement-bar--member">
      <div className="announcement-bar__ticker-wrap">
        <div className="announcement-bar__ticker">
          {track.map((msg, i) => (
            <span key={i} className="announcement-bar__ticker-item">
              <span className="announcement-bar__icon">&#128274;</span>
              {" "}{msg}{" "}
              {!userData && (
                <Link to="/login" className="announcement-bar__cta">
                  Log in &rsaquo;
                </Link>
              )}
              <span className="announcement-bar__sep">&nbsp;&bull;&nbsp;</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  userData: state.userData.userData,
  merchant: state.merchantData.merchant,
});

export default connect(mapStateToProps)(AnnouncementBar);
