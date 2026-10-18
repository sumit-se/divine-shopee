/**
 * SEO helpers.
 *
 * Canonical URLs have to be absolute and point at the host the pages are
 * actually served from, not whatever the browser happens to be on: a canonical
 * of http://localhost:3000/... shipped to production tells a crawler the real
 * page is somewhere it cannot reach. The host therefore comes from runtime
 * config, the same place every other environment value does, and falls back to
 * the live site rather than to window.location.
 *
 * Why these matter here: the storefront serves HTTP 200 for every path (the
 * .htaccess rewrite sends anything that is not a file to index.html), so a
 * crawler can reach the same content down any number of URLs and gets no
 * status code saying otherwise. The canonical tag is what tells it which one
 * counts.
 */

const FALLBACK_SITE = 'https://divineshopee.in';

/** The canonical origin, without a trailing slash. */
export const siteUrl = () => {
  const configured = (typeof window !== 'undefined'
    && window._env_
    && window._env_.APP_SITE_URL) || '';
  return (configured || FALLBACK_SITE).replace(/\/+$/, '');
};

/**
 * Absolute canonical URL for the page being viewed.
 *
 * Built from pathname alone, so query strings and hashes are dropped: ?page=2
 * and #reviews are the same document as far as indexing is concerned, and
 * letting them through would defeat the point of the tag.
 *
 * @param {string} [path] override, e.g. to point a variant at its parent
 */
export const canonicalUrl = (path) => {
  const p = path !== undefined && path !== null
    ? path
    : (typeof window !== 'undefined' ? window.location.pathname : '/');
  const clean = ('/' + String(p).replace(/^\/+/, '')).replace(/\/+$/, '') || '/';
  return siteUrl() + (clean === '/' ? '/' : clean);
};
