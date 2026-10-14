/**
 * The price bands offered by the sidebar facet, shared so the search results
 * and the category pages cannot drift apart.
 *
 * Fixed edges rather than quantiles of whatever matched: they read as round
 * numbers, and they stay put from one page to the next so a shopper learns
 * them once. Lower bound inclusive, upper exclusive, so adjacent bands never
 * both claim the same product.
 *
 * The two pages apply them differently, because they load differently:
 *
 *  - search holds its whole result set and filters in the browser, matching on
 *    the product's `price`, the single number the API puts on the listing;
 *  - a category page is paged by the server, so it passes minPrice/maxPrice to
 *    /products and the query matches a product when *any* of its prices falls
 *    in the band. A bead sold at several weights therefore appears in every
 *    band those weights reach -- which is what filtering for "under 5,000"
 *    means to a shopper, but it does mean the band counts can sum to more than
 *    the category holds.
 */
export const PRICE_BANDS = [
  { id: "u1k", label: "Under ₹1,000", min: 0, max: 1000 },
  { id: "1k5k", label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
  { id: "5k20k", label: "₹5,000 – ₹20,000", min: 5000, max: 20000 },
  { id: "20k1l", label: "₹20,000 – ₹1,00,000", min: 20000, max: 100000 },
  { id: "o1l", label: "Over ₹1,00,000", min: 100000, max: null }
];

export const bandById = id => PRICE_BANDS.find(band => band.id === id) || null;

/** The query string fragment for a band, for the pages that filter server side. */
export const bandParams = band => {
  if (!band) return "";
  let params = "";
  if (band.min !== null && band.min !== undefined) params += "&minPrice=" + band.min;
  if (band.max !== null && band.max !== undefined) params += "&maxPrice=" + band.max;
  return params;
};

/** Does this product fall in the band? For the pages that filter in the browser. */
export const inBand = (product, band) => {
  const price = Number(product && product.price);
  if (isNaN(price) || !band) return false;
  return price >= band.min && (band.max === null || price < band.max);
};
