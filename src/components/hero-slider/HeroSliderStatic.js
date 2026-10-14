import PropTypes from "prop-types";
import React from "react";

/**
 * Home-page intro block, matched to the equivalent section on divineshopee.com:
 * the copy on the left, the artwork on the right.
 *
 * The theme shipped this the other way round -- artwork left, copy right, set
 * in oversized caps -- and it already carried this exact wording via Pitch1 /
 * Pitch2 / Pitch4, so this is the same content re-laid-out rather than a second
 * copy of it. Measured against the source at a 1280 viewport: heading 40px
 * Poppins 700 on a 40px line, body 17px on 25.5px justified, both in a 602px
 * column; artwork 469px wide on the right with a 3px white border, a
 * 20/20/20/0 radius and a soft drop shadow.
 */
const HeroSliderStatic = ({ pitch1, pitch2, pitch4 }) => {
  return (
    <div className="row divine-journey align-items-center">
      <div className="col-lg-6 divine-journey__copy">
        {/*
          h1, not h2: this is the home page's primary heading and the page had
          no h1 at all -- the document previously started at h2. HeroSlider is
          only ever rendered on the home page, so there is no risk of a second
          h1 appearing elsewhere. The quotes are how the source site writes it.
        */}
        <h1>&quot;{pitch2}&quot;</h1>
        <p>
          <strong>{pitch1}..</strong>
        </p>
        <p>{pitch4}</p>
      </div>
      <div className="col-lg-6 divine-journey__art">
        <img
          src="assets/img/banner/divine-journey.jpg"
          alt="A family singing devotional bhajans together"
          width="469"
          height="264"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
};

HeroSliderStatic.propTypes = {
  pitch1: PropTypes.string,
  pitch2: PropTypes.string,
  pitch4: PropTypes.string
};

export default HeroSliderStatic;
