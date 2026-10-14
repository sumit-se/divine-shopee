import React from "react";

/**
 * Full-width strip above the header, as on divineshopee.com (sampled 23 Aug
 * 2026: #d50101 ground, white Poppins 700 / 20px, centred, 10px padding).
 *
 * The source copy is "Get it for just $349 or Enjoy free shipping" -- a dollar
 * price and a US shipping rule. This store prices in rupees and ships only
 * within India, so the threshold below is a rupee figure rather than a
 * conversion of $349. It is a guess at a sensible round number, NOT a real
 * published offer: change it (and the wording) to whatever the actual policy
 * is before this goes in front of customers.
 */
const FREE_SHIPPING_THRESHOLD = "₹5,000";

const AnnouncementBar = () => (
  <div className="announcement-bar">
    <p className="announcement-bar__text">
      Free shipping on all orders over {FREE_SHIPPING_THRESHOLD}
    </p>
  </div>
);

export default AnnouncementBar;
