import PropTypes from "prop-types";
import React from "react";

const BANNER = process.env.PUBLIC_URL + "/assets/img/banner/divine-shopee-experience";

/**
 * The "Divine Shopee Experience" banner, which divineshopee.com runs full-bleed
 * between the hero and the product grid.
 *
 * On the source site this is a single flat image (Blue-Gradient-Header-Banner-3
 * .png, 1600x480) -- the statue, the copy and the five stars are all baked into
 * the artwork, and none of it exists as text in their DOM. It is reproduced the
 * same way here rather than rebuilt as markup, so it stays pixel-identical to
 * the source. The trade-off is that the wording cannot be translated or
 * restyled without re-exporting the image, so the copy is mirrored into `alt`
 * to keep it available to screen readers and to search engines.
 *
 * Sits inside the page's content column rather than running edge to edge:
 * divineshopee.com bleeds this to the viewport, but every other section on our
 * page stops at the 1170px column, so full-bleed left it visibly wider than
 * the rest of the page.
 *
 * Served as WebP with a PNG fallback: the same artwork is 394 KB as PNG and
 * 52 KB as WebP, and this is the largest asset on the home page after the hero.
 * The <picture> fallback costs nothing at runtime -- any browser new enough to
 * matter takes the WebP and never requests the PNG.
 */
const ExperienceBanner = ({ spaceTopClass, spaceBottomClass }) => (
  <div
    className={`experience-banner-area ${spaceTopClass ? spaceTopClass : ""} ${
      spaceBottomClass ? spaceBottomClass : ""
    }`}
  >
    <div className="container">
    <picture>
      {/* 480w spares low-DPI phones the full-width file; anything needing more
          than that resolves to the 1600w original, which is the artwork's
          intrinsic size and the widest the source site ships. */}
      <source
        type="image/webp"
        sizes="100vw"
        srcSet={`${BANNER}-small.webp 480w, ${BANNER}.webp 1600w`}
      />
      {/* width/height are the artwork's intrinsic size: they give the browser
          the aspect ratio up front so the banner does not shift the page as it
          loads -- which matters more now that it loads lazily. */}
      <img
        src={`${BANNER}.png`}
        width="1600"
        height="480"
        loading="lazy"
        decoding="async"
        alt={
          'Divine Shopee Experience. "What You See Is What You Get" -- a seamless ' +
          "shopping experience where your selections appear exactly as delivered. " +
          "Divine Shopee ensures clarity, trust, and perfection in every purchase."
        }
      />
    </picture>
    </div>
  </div>
);

ExperienceBanner.propTypes = {
  spaceTopClass: PropTypes.string,
  spaceBottomClass: PropTypes.string
};

export default ExperienceBanner;
