import PropTypes from "prop-types";
import React from "react";
import Swiper from "react-id-swiper";
import "swiper/swiper.scss";

/**
 * Full-width promotional carousel for the top of the home page, matching the
 * banner slider the previous site runs above its intro copy: one slide in view,
 * looping, 1200x450 at desktop.
 *
 * The source autoplays with no controls at all -- no arrows, no bullets -- so
 * there is no way to go back to a slide you missed, and nothing for keyboard
 * users. Bullets and arrows are added here for that reason. Autoplay keeps
 * running after an interaction and pauses while the pointer is over the
 * banner, so a slide is never pulled away mid-read.
 */
const SLIDES = [
  { img: "slide-1.webp", alt: "Certified Rudraksha collection" },
  { img: "slide-2.webp", alt: "Divine Shopee main banner" },
  { img: "slide-3.webp", alt: "Authentic tradition-rooted products" },
  { img: "slide-4.webp", alt: "Rudraksha and spiritual essentials" },
  { img: "slide-5.webp", alt: "Shop genuine lab-tested Rudraksha" }
];

const HeroCarousel = ({ spaceTopClass, spaceBottomClass }) => {
  const settings = {
    loop: true,
    slidesPerView: 1,
    grabCursor: true,
    // disableOnInteraction was true, which killed autoplay permanently the
    // first time anyone touched an arrow or a bullet -- so the carousel stopped
    // scrolling for the rest of the visit. It now resumes after an interaction.
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
      className={`hero-carousel-area ${spaceTopClass ? spaceTopClass : ""} ${
        spaceBottomClass ? spaceBottomClass : ""
      }`}
    >
      <div className="container">
        <Swiper {...settings}>
          {SLIDES.map((slide, i) => (
            <div className="swiper-slide" key={slide.img}>
              <div className="hero-carousel__slide">
                {/*
                  Artwork is 1365x538 and the frame is 1200x450, so `cover`
                  trims a little top and bottom rather than squashing it --
                  the same fit the source uses.

                  The first slide is the page's largest above-the-fold image,
                  so it loads eagerly and the rest lazily; without that split
                  every slide in the loop is fetched before first paint.
                */}
                <img
                  src={process.env.PUBLIC_URL + "/assets/img/hero-carousel/" + slide.img}
                  alt={slide.alt}
                  width="1365"
                  height="538"
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
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

export default HeroCarousel;
