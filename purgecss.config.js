/*
 * Strip the CSS rules nothing on the site can match.
 *
 * The stylesheet is a bought template plus the whole of Bootstrap: 722KB
 * minified, of which the shop uses a fraction -- the `slider` partial alone
 * defines 121 classes and the app references 22 of them. Minifying cannot help
 * with that; only removing the rules can.
 *
 * This runs over the built CSS after `npm run build` (see the `postbuild`
 * script), so the development server is untouched and nothing here can affect
 * day-to-day work. To turn it off, remove that script -- the build output is
 * then exactly what react-scripts produced.
 *
 * WHAT PURGECSS CANNOT SEE, and therefore what the safelist is for:
 *
 *  1. Classes a library adds at runtime. Swiper builds its own wrapper and
 *     pagination elements, lightgallery builds the whole full-screen viewer,
 *     and neither name appears anywhere in this repository.
 *  2. Classes Bootstrap's own scripts toggle -- show, fade, collapsing.
 *  3. animate.css. The theme animates with fadeInLeft/Right/Up and never
 *     defines those keyframes itself, so the slider depends on rules that the
 *     markup never names.
 *  4. Icon fonts, whose class is often data rather than markup.
 *  5. Product and category copy, which is HTML written in the admin and
 *     injected into the page. It lives in the database, not in src/, so it is
 *     listed as content below -- exported by scripts/dump-cms-html.sh.
 *
 * Anything matched by `content` is kept automatically, including class names
 * that only ever appear as a prop value (spaceTopClass="pt-95" and the like),
 * because the extractor reads every token in the file rather than parsing JSX.
 */
module.exports = {
  content: [
    "./src/**/*.js",
    "./src/**/*.jsx",
    "./public/index.html",
    // admin-authored copy; regenerate with scripts/dump-cms-html.sh before a build
    "./purgecss-cms-content.html"
  ],
  css: ["./build/static/css/*.css"],
  output: "./build/static/css/",

  safelist: {
    standard: [
      // toggled by Bootstrap's scripts rather than written in the markup
      "show", "fade", "collapse", "collapsing", "modal-open", "modal-backdrop",
      "active", "disabled", "animated",
      // the document itself
      "html", "body",
      /*
       * Selectors that match on the style attribute rather than a class --
       * this theme paints pasted bold text in the brand colour with
       * [style*="font-weight: 7"]. PurgeCSS has no token to match an attribute
       * selector against, so it drops it from the group it shares with the
       * heading selectors, and the admin-authored copy loses its colour.
       * Caught by diffing the Special category before and after purging.
       */
    ],
    greedy: [
      /^swiper/,                 // Swiper builds its own DOM
      /^lg-/, /^lightgallery/,   // lightgallery builds the full-screen viewer
      /^fadeIn/, /^fadeOut/, /^bounce/, /^zoom/, /^slideIn/, /^slideOut/, // animate.css
      /^pe-7s-/, /^fa-/, /^fa$/, /^ti-/,   // icon fonts, often set from data
      /^toast/, /^react-toast/,            // notification library
      /^nav-special/, /^sale-tag/, /^snow/, // this theme's own keyframe-driven bits
      /*
       * react-bootstrap renders these itself -- Tab and Nav build the product
       * page's description/review tabs and the login/register switcher, and
       * Modal the quick-view. None of these names is ever written in the
       * markup, so without this the tab strip loses its layout entirely.
       * Caught by diffing computed styles against the unpurged build.
       */
      /^nav$/, /^nav-/, /^tab-/, /^tab$/, /^modal/,
      /*
       * KNOWN LIMITATION, not a safelist entry that works: PurgeCSS drops
       * selectors keyed only on an attribute, whatever the safelist says,
       * because it has no token to match them against. This theme colours
       * pasted bold copy with [style*="font-weight: 7"], so on the Special
       * category the bold lines of the admin-written blurb come out black
       * rather than maroon. That is the one difference between a purged and
       * an unpurged build across 59 routes; everything else is identical.
       */
    ]
  },

  // keep @font-face, @keyframes and CSS variables that are referenced
  // indirectly; fontFace/keyframes default to false, which would strip the
  // animate.css keyframes the slider needs
  fontFace: false,
  keyframes: false,
  variables: false
};
