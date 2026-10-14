/*
 * Product addresses that have moved: old slug -> current slug.
 *
 * Product slugs came across from the old WooCommerce site as they were. When
 * one is corrected, its old address may still be in search results, bookmarks
 * and shared links, so it is listed here and the product page sends the
 * visitor on to the current address instead of showing "not found".
 *
 * On a production host, add the same moves as server-side 301 redirects too
 * (e.g. in nginx): search engines give those the most weight.
 */
export const PRODUCT_REDIRECTS = {
  // WooCommerce's "Duplicate" had added "-copy"; corrected 2026-09-28
  "11-mukhi-rudrakshawswyg-copy": "11-mukhi-rudrakshawswyg"
};

/** The current slug for an old one, or null when the slug has not moved. */
export const productRedirect = (slug) =>
  Object.prototype.hasOwnProperty.call(PRODUCT_REDIRECTS, slug) ? PRODUCT_REDIRECTS[slug] : null;
