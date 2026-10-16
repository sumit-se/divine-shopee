import PropTypes from "prop-types";
import React from "react";

/**
 * Category hero + description, matching the archive template on
 * The previous site: the category name in large white type over a darkened
 * photo, with the category's own description underneath.
 *
 * The photograph is one shared image, not a per-category one -- on the source
 * it lives in the archive template's CSS, so every category page shows the same
 * hands-holding-rudraksha shot. Measured there: 303px tall (152px on mobile),
 * cover/centre, a 50% black wash over it, and the title at 70px Poppins bold.
 *
 * `description` is Shopizer's category description, which comes in two shapes:
 *
 *  - plain text with CRLF breaks, as the API seeded it. Shown complete in a
 *    read-only five-row <textarea>, which preserves those breaks and scrolls
 *    the overflow.
 *  - HTML, once the category has been edited through the admin console, whose
 *    description field is a WYSIWYG editor. Rendered as markup in a box of the
 *    same height, so the editor's bold labels and lists come out as intended
 *    instead of the visitor reading "<p><b>Recommended for:".
 *
 * Same split, and the same test, as ProductDescription.js.
 */
/**
 * Categories with a banner of their own, by category code; the file is in
 * public/assets/img/category/. A sub-category without one uses its parent's
 * (so every Rudraksha sub-category shows the Rudraksha banner, under its own
 * name). Every other category keeps the shared photo.
 *
 * `artwork`: the image is designed artwork carrying its own headline, so it is
 * shown whole (no crop, no dark wash) and the category name continues that
 * headline, placed under it -- see .category-banner__media--artwork.
 *
 * `flash`: the name is filled with a gold gradient and lit from behind, for a
 * sale artwork whose own lettering is gradient-filled and glowing and beside
 * which a flat name looks unfinished. It replaces the colour and the shadow,
 * so titleColor and titleShadow are ignored -- see
 * .category-banner__title--flash.
 *
 * Every artwork puts its headline somewhere else, so where the name goes, how
 * big it is and what colour it takes are given per banner by the title* keys
 * below and passed to the stylesheet as custom properties. Leave one out and
 * the Rudraksha placement is used, which is what those defaults are.
 */
const CATEGORY_BANNERS = {
  // headline "Sourced from Nepal / ISO Certified Lab Tested" + "Rudraksha".
  // titleFont: the face the name is set in, matched to the artwork's lettering.
  // On a phone the whole picture is too small to read, so it shows only the
  // Shiva-and-peak side, and the claims are printed as text under it.
  rudraksha: {
    file: "rudraksha-banner.webp",
    artwork: true,
    titleFont: '"Oswald"',
    mobileClaims: ["Sourced from Nepal", "ISO Certified", "Lab Tested"]
  },
  // headline "100% Natural & Organic", Vishnu at the left edge and a gold
  // shankh at the right. This one is 1100x303, not the 1170x303 the Rudraksha
  // banner is, hence `aspect`: stretched into the other's box it came out ~6%
  // wide. Measured off the artwork: the lettering is centred 44.2% across,
  // ends 38% down and stands 5.1% of the width tall, so the name sits just
  // under it at the same size. It is set in the artwork's own gold -- the
  // maroon the Rudraksha name uses would sink into the navy starfield here.
  // No mobileClaims: this headline is one short phrase and stays legible at
  // phone width, so the whole picture is kept.
  shankh: {
    file: "shankh-banner.webp",
    artwork: true,
    aspect: "1100 / 303",
    titleFont: '"Oswald"',
    titleLeft: "44.2%",
    titleTop: "42.5%",
    titleSize: "5.1cqw",
    titleColor: "#ffd45e",
    titleShadow: "0 2px 10px rgba(0, 0, 0, .85), 0 0 3px rgba(0, 0, 0, .9)"
  },
  // The inaugural-offer artwork: a circular "Grand Inaugural Offers" badge over
  // an orange ground, a gift box in each bottom corner and the sale claims set
  // in mint down the right. 1170x308, five pixels taller than the Rudraksha
  // banner, hence `aspect`: left in the default 1170/303 box it is squeezed
  // about 1.6%.
  //
  // The name sits under the strip of beads, not at the Rudraksha position,
  // which here lands on "100% ORGANIC", and it shares a line with the last of
  // the claims on the right.
  //
  // Down: its baseline is set to the baseline of "TESTED RANGE!", which the
  // artwork puts at 286 of 308. Working back through Oswald's own metrics at
  // this size -- the line box is 1.1em, so the baseline sits half the leading
  // plus the ascent below the top of the box -- that top is 79.5%.
  //
  // Across, it is centred on the clear ground rather than on the beads. The
  // gift box widens towards the bottom of the artwork (its edge is at 270px on
  // the name's top row and 290px by its last), and a star of the badge reaches
  // in at 500px on the upper rows, so the ground usable along the whole height
  // of the name is 25.6-41.9%. Centred at 33.8% that leaves about 34px either
  // side. The name still overhangs the beads, which is the point: the strip
  // spans roughly 21-41% and the name 28.6-39%.
  //
  // The size is what buys both clearances, and it is the only thing that can.
  // The beads bottom out at 228 and the artwork ends at 308, so there are 80px
  // for a line box that is 1.1em tall; with the baseline pinned, a larger face
  // can only grow upwards into the beads. Measured: 4.2cqw leaves 8px above
  // the beads and 22px at the sides, 3.8cqw leaves 14px and 29px, and 3.2cqw
  // leaves 20px and 40px. 3.5cqw is the middle of that -- 17px and 34px.
  //
  // Gold-filled (`flash`) to hold its own against lettering that is itself
  // gradient-filled and glowing.
  //
  // No mobileClaims: the phone crop is cut for the Rudraksha artwork (the
  // first 540px of 1170, pinned left) and would slice this badge in half. As
  // with the shankh banner the whole picture is kept instead -- the badge is
  // the message and stays legible at phone width.
  special: {
    file: "special-banner.jpg",
    artwork: true,
    flash: true,
    aspect: "1170 / 308",
    titleFont: '"Oswald"',
    titleLeft: "33.8%",
    titleTop: "79.5%",
    titleSize: "3.5cqw"
  },
  // A crystal egg, a sphatik mala and a shivling on a coral ground. Unlike the
  // others this picture carries no lettering of its own, so the name is not
  // completing a headline -- it is the headline, and it has nowhere quiet to
  // sit: the three products take the left, middle and right, and the two gaps
  // between them are about 220px, far short of the ~420px the name needs. So
  // it runs across the middle over a wash, which is how every category without
  // its own artwork is already titled.
  //
  // `wash` rather than the plain treatment because that one is `cover`: a
  // 1170x308 picture in the 930x303 box would crop ~20% off the sides and lose
  // the egg and the shivling. Shown whole at its own proportions instead, with
  // the veil put back over it. .42 is lighter than the .5 the plain treatment
  // uses -- enough for white type, little enough to leave the coral bright.
  "sphatik-products": {
    file: "sphatik-banner.webp",
    artwork: true,
    aspect: "1170 / 308",
    wash: "rgba(0, 0, 0, .42)",
    titleFont: '"Oswald"',
    titleLeft: "50%",
    titleTop: "50%",
    titleTranslate: "translate(-50%, -50%)",
    titleSize: "4.6cqw",
    titleColor: "#ffffff",
    titleShadow: "0 2px 14px rgba(0, 0, 0, .8)"
  },
  // A crystal lingam on the left and a shivling in its jalahari on the right,
  // both on tan pedestals, over a coral crystal ground. Same situation as the
  // sphatik banner above and handled the same way: the picture carries no
  // lettering, the ground is busy with sparkles everywhere rather than quiet
  // anywhere, so the name is the headline and runs across the middle over a
  // wash.
  //
  // The size is where it differs. "Shiva Lingam & Jalahari" is half as long
  // again as "Sphatik Products", so sphatik's 4.6cqw sets it 585px wide.
  // Sampled off the artwork along the pedestal row, the left pedestal ends at
  // 285 and the right begins at 890, leaving 605px of clear ground: the name
  // would have had 7px either side. 4cqw sets it 508px and leaves about 46px,
  // and there is more room still at the height the name actually sits, where
  // the two products end at 280 and 975.
  shivalingajalahari: {
    file: "shivalinga-banner.webp",
    artwork: true,
    aspect: "1170 / 308",
    wash: "rgba(0, 0, 0, .42)",
    titleFont: '"Oswald"',
    titleLeft: "50%",
    titleTop: "50%",
    titleTranslate: "translate(-50%, -50%)",
    titleSize: "4cqw",
    titleColor: "#ffffff",
    titleShadow: "0 2px 14px rgba(0, 0, 0, .8)"
  },
  // Diyas and mandalas down both edges with the Divine Shopee lockup centred
  // at the top, on an orange gradient.
  //
  // The lockup is the headline, so the name goes under it, which is also the
  // one quiet part of the picture. Sampled off the artwork: the lockup --
  // Shiva, the wordmark and "HOME OF DIVINE PRODUCTS" -- bottoms out at 158 of
  // 308, and below that the middle is unbroken gradient. The mandalas reach in
  // to 300 on the left and 870 on the right along the name's rows, which at
  // 5cqw still leaves about 104px either side; the name is short enough that
  // width was never the constraint here.
  //
  // No `wash`, unlike the sphatik and shivalinga banners. Those needed one
  // because their names sit over busy picture; this one sits on bare gradient,
  // and a veil would only dull the artwork around it. White with a warm dark
  // shadow is enough to lift it off the orange.
  poojaproducts: {
    file: "poojaproducts-banner.jpg",
    artwork: true,
    aspect: "1170 / 308",
    titleFont: '"Oswald"',
    titleLeft: "50%",
    titleTop: "75%",
    titleTranslate: "translate(-50%, -50%)",
    titleSize: "5cqw",
    titleColor: "#ffffff",
    titleShadow: "0 2px 12px rgba(90, 30, 0, .9), 0 0 4px rgba(70, 20, 0, .8)"
  },
  // The hands-holding-rudraksha photograph. It used to be the stand-in every
  // category without artwork of its own was given; it is listed here because
  // Mala & Jaap Mala is the one it is actually for, and nothing else should
  // inherit it by default.
  //
  // A photograph, not artwork: no `artwork` key, so it keeps the plain
  // treatment -- cropped to fill the box, darkened, the name centred over it
  // in white -- which is how it has always been shown.
  mala: {
    file: "category-banner.jpg"
  }
};

/** Where the banner files live, relative to PUBLIC_URL. */
const BANNER_DIR = "/assets/img/category/";

/*
 * There is no longer a picture every unlisted category falls back to. The
 * hands-holding-rudraksha photo that used to serve that purpose now belongs to
 * Mala & Jaap Mala and is listed against it above, like any other banner: a
 * category either has artwork of its own, inherits its parent's, or shows none
 * -- which is a visible prompt to give it one rather than a stand-in that
 * quietly looks like a choice.
 */

/**
 * The picture a category is shown with, resolved the way the banner resolves
 * it: its own artwork, else its parent's -- so a Rudraksha sub-category
 * borrows the Rudraksha banner -- else the shared photo.
 *
 * Exported because the shop-by-category tiles on the home page draw from the
 * same map. One list, so adding a banner here puts it in both places at once,
 * and the tile a shopper clicks always matches the banner they land on.
 */
export const categoryImageUrl = (code, parentCode) => {
  const banner = CATEGORY_BANNERS[code] || CATEGORY_BANNERS[parentCode];
  return banner ? process.env.PUBLIC_URL + BANNER_DIR + banner.file : null;
};

/**
 * The same picture at thumbnail size, for the shop-by-category tiles.
 *
 * Every banner has a rescaled copy under tiles/, built by
 * scripts/generate-category-tiles.sh and always written as .jpg because sips
 * reads webp but cannot write it. The tile is about 170px wide, so serving the
 * 1170px banner for it costs 80-130KB a tile to paint a thumbnail; these are
 * around 23KB.
 *
 * Rescaled rather than cropped, so the whole artwork is kept: these banners
 * are nearly 4:1 with their subjects out at the edges, and a square-ish crop
 * keeps the empty middle and discards the subject.
 *
 * Run that script after adding a banner, or the tile 404s.
 */
export const categoryTileUrl = (code, parentCode) => {
  const banner = CATEGORY_BANNERS[code] || CATEGORY_BANNERS[parentCode];
  if (!banner) {
    return null;
  }
  return process.env.PUBLIC_URL + BANNER_DIR + "tiles/" + banner.file.replace(/\.[^.]+$/, ".jpg");
};

/** The keys above that are passed to the stylesheet as custom properties. */
const BANNER_PROPERTIES = {
  aspect: "--banner-aspect",
  wash: "--banner-wash",
  titleFont: "--banner-title-font",
  titleLeft: "--banner-title-left",
  titleTop: "--banner-title-top",
  titleTranslate: "--banner-title-translate",
  titleSize: "--banner-title-size",
  titleColor: "--banner-title-color",
  titleShadow: "--banner-title-shadow"
};

const CategoryBanner = ({ name, description, code, parentCode, strings }) => {
  if (!name) return null;

  // What a description amounts to once it is on the page: tags and entities
  // out, whitespace collapsed. A description can be non-empty as a string and
  // still show nothing -- clearing the field in the admin's rich-text editor
  // leaves markup behind rather than an empty string, and "Mala & Jaap Mala"
  // was stored as the four characters `<br>`, which satisfied every test here
  // and drew an empty panel under the banner.
  //
  // Media counts as content even though it contributes no text: a description
  // that is only an <img> says something, and stripping tags would hide it.
  const renders = html =>
    /<(img|iframe|video)\b/i.test(html) ||
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&[a-z]+;|&#\d+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim().length > 0;

  // 10 of the 31 categories carry the name again in place of a description;
  // printing "Rudraksha" as the blurb for Rudraksha is just noise. Compared on
  // the text rather than the raw string, so `<p>Rudraksha</p>` is caught too.
  const plain = (description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const hasBlurb =
    !!description &&
    renders(description) &&
    plain !== name.trim();

  // The whole description, verbatim. Plain text is normalised to \n only so
  // the line breaks are consistent across platforms; HTML is left alone.
  const blurbText = hasBlurb
    ? description.replace(/\r\n|\r/g, "\n").trim()
    : "";

  // Authored through the admin's rich-text editor rather than seeded as text.
  const isHtml = hasBlurb && /<[a-z/][^>]*>/i.test(blurbText);

  const banner = CATEGORY_BANNERS[code] || CATEGORY_BANNERS[parentCode];
  const image = categoryImageUrl(code, parentCode);
  const media = {
    ...Object.keys(BANNER_PROPERTIES).reduce((properties, key) => {
      if (banner && banner[key]) {
        properties[BANNER_PROPERTIES[key]] = banner[key];
      }
      return properties;
    }, {}),
    // no artwork: the box keeps its ground colour and carries the name alone
    ...(image ? { backgroundImage: "url(" + image + ")" } : {})
  };

  return (
    <div className="category-banner">
      <div className="container">
        <div
          className={"category-banner__media"
            + (banner && banner.artwork ? " category-banner__media--artwork" : "")
            /* only an artwork that names mobileClaims is cropped on a phone */
            + (banner && banner.mobileClaims ? " category-banner__media--cropmobile" : "")}
          style={media}
        >
          {banner && banner.mobileClaims && (
            <div className="category-banner__art" style={media} aria-hidden="true" />
          )}
          <h1
            className={"category-banner__title"
              + (banner && banner.flash ? " category-banner__title--flash" : "")}
          >
            {name}
          </h1>
          {banner && banner.mobileClaims && (
            <ul className="category-banner__claims">
              {banner.mobileClaims.map(claim => (
                <li key={claim}>{strings && strings[claim] ? strings[claim] : claim}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {hasBlurb && (
        <div className="container">
          <div className="category-banner__blurb">
            {isHtml ? (
              /*
                Admin-authored markup. Same treatment the product description,
                the content pages and the header banner already give their
                HTML fields: it comes from the store's own admin console, not
                from a shopper.
              */
              <div
                className="category-banner__blurb-text category-banner__blurb-text--html"
                dangerouslySetInnerHTML={{ __html: blurbText }}
              />
            ) : (
              /*
                A real <textarea>, five rows tall, holding the complete
                description. readOnly because this is shop copy, not an input --
                it stays selectable and scrollable but cannot be edited, and is
                kept out of any surrounding form submission by having no name.
              */
              <textarea
                className="category-banner__blurb-text"
                rows={5}
                readOnly
                value={blurbText}
                aria-label={name + " description"}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

CategoryBanner.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  code: PropTypes.string,
  parentCode: PropTypes.string,
  strings: PropTypes.object
};

export default CategoryBanner;
