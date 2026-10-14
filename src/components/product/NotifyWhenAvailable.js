import PropTypes from "prop-types";
import React, { useState } from "react";
import WebService from "../../util/webService";
import constant from "../../util/constant";
import { getLocalData, setLocalData } from "../../util/helper";

// products this browser already asked about, so the page says so on return
const SUBSCRIBED_KEY = "stock-alerts";
const subscribedIds = () => {
  try {
    return JSON.parse(getLocalData(SUBSCRIBED_KEY) || "[]") || [];
  } catch (e) {
    return [];
  }
};

/**
 * Takes the place of "Out of stock" on a sold-out product: the shopper leaves
 * an email (and, optionally, a WhatsApp number) and is told once the product
 * can be bought again -- a new bead added or stock restored (StockAlertApi).
 */
const NotifyWhenAvailable = ({ product, hasVariants, defaultStore, currentLanguageCode, defaultEmail, strings, addToast }) => {
  const t = (key, fallback) => (strings && strings[key]) || fallback;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail || "");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [subscribed, setSubscribed] = useState(subscribedIds().indexOf(product.id) !== -1);

  const submit = async (event) => {
    event.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      addToast(t("Please enter a valid email address", "Please enter a valid email address"),
        { appearance: "error", autoDismiss: true });
      return;
    }
    setSending(true);
    try {
      await WebService.post(
        constant.ACTION.PRODUCT + product.id + "/stock-alert?store=" + defaultStore + "&lang=" + (currentLanguageCode || "en"),
        { email: email.trim(), phone: phone.trim() || null });
      setLocalData(SUBSCRIBED_KEY, JSON.stringify(subscribedIds().concat([product.id])));
      setSubscribed(true);
      setOpen(false);
    } catch (error) {
      const message = error && error.response && error.response.data && error.response.data.message;
      addToast(message || t("Could not save your request, please try again", "Could not save your request, please try again"),
        { appearance: "error", autoDismiss: true });
    }
    setSending(false);
  };

  return (
    <div className="notify-available">
      <p className="notify-available__status">
        <b>{hasVariants ? t("All beads sold", "All beads sold") : t("Out of stock", "Out of stock")}</b>
        {" — "}
        {hasVariants
          ? t("new beads are added regularly.", "new beads are added regularly.")
          : t("it will be back soon.", "it will be back soon.")}
      </p>

      {subscribed ? (
        <p className="notify-available__done">
          <span aria-hidden="true">✓</span>{" "}
          {t("You're on the list — we'll email you as soon as it's available.",
            "You're on the list — we'll email you as soon as it's available.")}
        </p>
      ) : !open ? (
        <div className="pro-details-cart btn-hover">
          <button type="button" onClick={() => setOpen(true)}>
            <i className="pe-7s-bell" aria-hidden="true"></i>{" "}{t("Notify me when available", "Notify me when available")}
          </button>
        </div>
      ) : (
        <form className="notify-available__form" onSubmit={submit}>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t("Your email address", "Your email address")}
            aria-label={t("Your email address", "Your email address")}
          />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder={t("WhatsApp number (optional)", "WhatsApp number (optional)")}
            aria-label={t("WhatsApp number (optional)", "WhatsApp number (optional)")}
          />
          <div className="notify-available__actions">
            <button type="submit" disabled={sending}>
              {sending ? t("Saving...", "Saving...") : t("Notify me", "Notify me")}
            </button>
            <button type="button" className="notify-available__cancel" onClick={() => setOpen(false)}>
              {t("Cancel", "Cancel")}
            </button>
          </div>
          <small>{t("One email when it's back, nothing else. You can cancel it from that email.",
            "One email when it's back, nothing else. You can cancel it from that email.")}</small>
        </form>
      )}
    </div>
  );
};

NotifyWhenAvailable.propTypes = {
  product: PropTypes.object.isRequired,
  hasVariants: PropTypes.bool,
  defaultStore: PropTypes.string,
  currentLanguageCode: PropTypes.string,
  defaultEmail: PropTypes.string,
  strings: PropTypes.object,
  addToast: PropTypes.func
};

export default NotifyWhenAvailable;
