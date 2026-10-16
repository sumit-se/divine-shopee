import PropTypes from "prop-types";
import React, { Fragment, useState } from "react";
import MetaTags from "react-meta-tags";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { useForm } from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import { connect } from "react-redux";
import { multilanguage } from "redux-multilanguage";

import Layout from "../../layouts/Layout";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import WebService from "../../util/webService";
import constant from "../../util/constant";
import { setLoader } from "../../redux/actions/loaderActions";

/**
 * Rudraksha recommendation request, modelled on the page of the same name on
 * The previous site ("Connect with our team of experts who will suggest the best
 * Rudraksha for you as per astronumerology").
 *
 * Their form is gated behind a login, so its exact field list is not visible
 * from outside. These are the inputs an astro-numerology reading actually
 * needs -- date, exact time and place of birth -- plus contact details and what
 * the person is seeking. Adjust to match their live form if you can see it.
 *
 * Submission goes to Shopizer's POST /api/v1/contact, which emails the store
 * owner. The astro details are packed into `comment` because that endpoint
 * takes a fixed shape (name / subject / email / comment) and there is no
 * custom-field support on it.
 */
const PURPOSES = [
  "Health and wellbeing",
  "Wealth, career and business",
  "Peace of mind and meditation",
  "Relationships and family",
  "Protection from negative energy",
  "Education and concentration",
  "Spiritual growth",
  "Not sure -- please advise"
];

const RudrakshaRecommendation = ({ strings, location, merchant, setLoader }) => {
  const { pathname } = location;
  const { addToast } = useToasts();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, errors, reset } = useForm({ mode: "onChange" });

  const onSubmit = async data => {
    setLoader(true);
    // The contact endpoint accepts only name/subject/email/comment, so the
    // reading details are laid out as labelled lines inside the comment --
    // readable as-is in the email the store owner receives.
    const comment = [
      `Purpose: ${data.purpose}`,
      `Date of birth: ${data.dob}`,
      `Time of birth: ${data.tob || "not provided"}`,
      `Place of birth: ${data.pob}`,
      `Gender: ${data.gender || "not provided"}`,
      `Phone: ${data.phone || "not provided"}`,
      "",
      "Message:",
      data.message || "(none)"
    ].join("\n");

    try {
      await WebService.post(constant.ACTION.CONTACT, {
        name: data.name,
        email: data.email,
        subject: "Rudraksha recommendation request",
        comment: comment
      });
      reset({});
      setSubmitted(true);
      addToast("Thank you — our experts will get back to you shortly.", {
        appearance: "success",
        autoDismiss: true
      });
    } catch (error) {
      // The store's SMTP credentials are placeholders, so this endpoint fails
      // until they are set. Say so plainly rather than failing silently, which
      // is what the theme's own contact form does.
      addToast(
        "Sorry, we could not send your request just now. Please try again, or email us directly.",
        { appearance: "error", autoDismiss: false }
      );
    }
    setLoader(false);
  };

  const err = name => errors[name] && (
    <span className="rudraksha-form__error">{errors[name].message}</span>
  );

  return (
    <Fragment>
      <MetaTags>
        <title>{merchant.name} | Rudraksha Recommendation</title>
        <meta
          name="description"
          content="Tell us your birth details and our experts will recommend the Rudraksha best suited to you as per astronumerology."
        />
      </MetaTags>

      <BreadcrumbsItem to={process.env.PUBLIC_URL + "/"}>{strings["Home"]}</BreadcrumbsItem>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + pathname}>
        Rudraksha Recommendation
      </BreadcrumbsItem>

      <Layout headerContainerClass="container-fluid" headerPaddingClass="header-padding-2" headerTop="visible">
        <Breadcrumb />

        <div className="rudraksha-form-area">
          <div className="container">
            <div className="rudraksha-form__intro">
              <h1>Rudraksha Recommendation</h1>
              <p>
                Connect with our team of experts who will suggest the best
                Rudraksha for you as per astronumerology.
              </p>
            </div>

            {submitted ? (
              <div className="rudraksha-form__done">
                <h2>Request received</h2>
                <p>
                  Thank you. Our experts will review your birth details and get
                  back to you by email with a personalised recommendation.
                </p>
                <button type="button" onClick={() => setSubmitted(false)}>
                  Submit another request
                </button>
              </div>
            ) : (
              <form className="rudraksha-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="rudraksha-form__grid">
                  <div className="rudraksha-form__field">
                    <label htmlFor="rr-name">Full name <span>*</span></label>
                    <input id="rr-name" name="name" type="text" placeholder="Your full name"
                      ref={register({ required: "Please enter your name" })} />
                    {err("name")}
                  </div>

                  <div className="rudraksha-form__field">
                    <label htmlFor="rr-email">Email <span>*</span></label>
                    <input id="rr-email" name="email" type="email" placeholder="you@example.com"
                      ref={register({
                        required: "Please enter your email",
                        pattern: { value: /^\S+@\S+\.\S+$/, message: "Please enter a valid email" }
                      })} />
                    {err("email")}
                  </div>

                  <div className="rudraksha-form__field">
                    <label htmlFor="rr-phone">Phone</label>
                    <input id="rr-phone" name="phone" type="tel" placeholder="Optional"
                      ref={register} />
                  </div>

                  <div className="rudraksha-form__field">
                    <label htmlFor="rr-gender">Gender</label>
                    <select id="rr-gender" name="gender" ref={register}>
                      <option value="">Select</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>

                  <div className="rudraksha-form__field">
                    <label htmlFor="rr-dob">Date of birth <span>*</span></label>
                    <input id="rr-dob" name="dob" type="date"
                      ref={register({ required: "Date of birth is needed for the reading" })} />
                    {err("dob")}
                  </div>

                  <div className="rudraksha-form__field">
                    <label htmlFor="rr-tob">Time of birth</label>
                    <input id="rr-tob" name="tob" type="time" ref={register} />
                    <small>As exact as you know it — it changes the reading.</small>
                  </div>

                  <div className="rudraksha-form__field rudraksha-form__field--wide">
                    <label htmlFor="rr-pob">Place of birth <span>*</span></label>
                    <input id="rr-pob" name="pob" type="text" placeholder="City, state, country"
                      ref={register({ required: "Place of birth is needed for the reading" })} />
                    {err("pob")}
                  </div>

                  <div className="rudraksha-form__field rudraksha-form__field--wide">
                    <label htmlFor="rr-purpose">What are you seeking? <span>*</span></label>
                    <select id="rr-purpose" name="purpose"
                      ref={register({ required: "Please choose what you are seeking" })}>
                      <option value="">Select</option>
                      {PURPOSES.map(p => <option key={p}>{p}</option>)}
                    </select>
                    {err("purpose")}
                  </div>

                  <div className="rudraksha-form__field rudraksha-form__field--wide">
                    <label htmlFor="rr-message">Anything else we should know?</label>
                    <textarea id="rr-message" name="message" rows={4}
                      placeholder="Health concerns, current Rudraksha you wear, questions…"
                      ref={register} />
                  </div>
                </div>

                <button type="submit" className="rudraksha-form__submit">
                  Get my recommendation
                </button>
                <p className="rudraksha-form__note">
                  Your details are used only to prepare your recommendation.
                </p>
              </form>
            )}
          </div>
        </div>
      </Layout>
    </Fragment>
  );
};

RudrakshaRecommendation.propTypes = {
  location: PropTypes.object,
  merchant: PropTypes.object,
  setLoader: PropTypes.func
};

const mapStateToProps = state => ({ merchant: state.merchantData.merchant });
const mapDispatchToProps = dispatch => ({
  setLoader: value => dispatch(setLoader(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(
  multilanguage(RudrakshaRecommendation)
);
