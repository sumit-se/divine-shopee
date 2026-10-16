import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import Swiper from "react-id-swiper";
import "swiper/swiper.scss";
import { connect } from "react-redux";
import WebService from "../../util/webService";
import constant from "../../util/constant";

/**
 * Full-width promotional carousel for the top of the home page.
 *
 * One slide is a dynamic HTML slide whose content (title, body text, support
 * email) is stored in the Shopizer CMS as a content page with the code
 * "carousel-customer-support". To edit it:
 *   Shopizer admin → Content → Manage Pages → carousel-customer-support
 *   - Name field          → slide heading
 *   - Description field   → slide body paragraph
 *   - Meta Description    → support email address
 */

const IMG_SLIDES = [
  { img: "slide-1.webp", alt: "Certified Rudraksha collection" },
  { img: "slide-3.webp", alt: "Authentic tradition-rooted products" },
  { img: "slide-4.webp", alt: "Rudraksha and spiritual essentials" },
  { img: "slide-5.webp", alt: "Shop genuine lab-tested Rudraksha" }
];

// Position in the final slide array where the dynamic support slide is inserted.
const SUPPORT_SLIDE_INDEX = 1;

const SupportSlide = ({ slideData }) => {
  if (!slideData) return null;
  const title = slideData.name || "Customer Support";
  const body  = slideData.description || "";
  const email = slideData.metaDescription || "";

  return (
    <div className="hero-carousel__support">
      <div className="hero-carousel__support-icon" aria-hidden="true">
        <i className="fa fa-headphones" />
      </div>
      <div className="hero-carousel__support-copy">
        <h3>{title}</h3>
        <p>{body}</p>
        {email && (
          <a href={`mailto:${email}`} className="hero-carousel__support-email">
            <i className="fa fa-envelope" aria-hidden="true" /> {email}
          </a>
        )}
      </div>
    </div>
  );
};

const HeroCarousel = ({ spaceTopClass, spaceBottomClass, defaultStore, currentLanguageCode }) => {
  const [slideData, setSlideData] = useState(null);

  useEffect(() => {
    const store = defaultStore || window._env_.APP_MERCHANT;
    const lang  = currentLanguageCode || "en";
    const url   = `${constant.ACTION.CONTENT}${constant.ACTION.PAGES}carousel-customer-support?lang=${lang}&store=${store}`;
    WebService.get(url)
      .then(res => setSlideData(res.description || null))
      .catch(() => {});
  }, [defaultStore, currentLanguageCode]);

  // Build the ordered slide list: image slides with the support slide spliced in.
  const slides = [
    ...IMG_SLIDES.slice(0, SUPPORT_SLIDE_INDEX),
    { type: "support" },
    ...IMG_SLIDES.slice(SUPPORT_SLIDE_INDEX)
  ];

  const settings = {
    loop: true,
    slidesPerView: 1,
    grabCursor: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: {
      nextEl: ".hero-carousel__next",
      prevEl: ".hero-carousel__prev"
    },
    renderPrevButton: () => (
      <button className="hero-carousel__prev" aria-label="Previous slide">
        <i className="fa fa-angle-left" />
      </button>
    ),
    renderNextButton: () => (
      <button className="hero-carousel__next" aria-label="Next slide">
        <i className="fa fa-angle-right" />
      </button>
    )
  };

  return (
    <div
      className={`hero-carousel-area ${spaceTopClass || ""} ${spaceBottomClass || ""}`}
    >
      <div className="container">
        <Swiper {...settings}>
          {slides.map((slide, i) => (
            <div className="swiper-slide" key={slide.type || slide.img}>
              <div className="hero-carousel__slide">
                {slide.type === "support" ? (
                  <SupportSlide slideData={slideData} />
                ) : (
                  <img
                    src={process.env.PUBLIC_URL + "/assets/img/hero-carousel/" + slide.img}
                    alt={slide.alt}
                    width="1365"
                    height="538"
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                )}
              </div>
            </div>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

HeroCarousel.propTypes = {
  spaceTopClass: PropTypes.string,
  spaceBottomClass: PropTypes.string
};

const mapStateToProps = state => ({
  defaultStore:        state.merchantData.defaultStore,
  currentLanguageCode: state.multilanguage.currentLanguageCode
});

export default connect(mapStateToProps)(HeroCarousel);
