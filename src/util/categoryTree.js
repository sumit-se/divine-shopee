import WebService from "./webService";
import constant from "./constant";

/**
 * The store's category tree, fetched once.
 *
 * Three places need the whole tree on nearly every page -- the header nav, the
 * search box's category filter and the home page's category strip -- and each
 * was asking for it separately. That is the same ~99KB response three times on
 * a single page load, three round trips before anything can render.
 *
 * Callers share one in-flight request and, once it resolves, the result. The
 * tree only changes when the shop's categories are edited in the admin, so a
 * page's lifetime is a safe thing to hold it for; a reload fetches it again.
 *
 * Keyed by store and language, because switching either has to re-fetch rather
 * than hand back the previous store's categories.
 */
const cache = new Map();

export const fetchCategoryTree = (storeCode, lang) => {
  const key = storeCode + "|" + lang;
  if (!cache.has(key)) {
    const request = WebService.get(
      constant.ACTION.CATEGORY + "?count=200&page=0&store=" + storeCode + "&lang=" + lang
    ).catch(error => {
      // a failed fetch must not be cached, or the nav stays empty until reload
      cache.delete(key);
      throw error;
    });
    cache.set(key, request);
  }
  return cache.get(key);
};

/** Forget what has been fetched -- for when the catalogue is known to have changed. */
export const clearCategoryTree = () => cache.clear();
