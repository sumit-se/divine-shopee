import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import WebService from "../../../util/webService";
import constant from "../../../util/constant";
import { visibleCategories, flattenCategories } from "../../../helpers/category";
import { fetchCategoryTree } from "../../../util/categoryTree";

/**
 * Header search, matching the pill field on the previous site, with a
 * suggestion list under it.
 *
 * Submitting navigates to /search/:id, which SearchProduct reads via
 * match.params.id. Picking a suggestion skips that page and goes straight to
 * the product or category.
 *
 * Nothing here talks to Shopizer's own search. POST /search and
 * /search/autocomplete are backed by OpenSearch, there is no search node
 * running, and both answer 500 ("searchClient is null") -- which is why the
 * autocomplete that used to live in IconGroup.js is commented out rather than
 * merely unused. Suggestions come from the same two places the rest of the
 * shop already reads:
 *
 *  - products from /products?name=, a case-insensitive partial match answered
 *    from the database, which is what SearchProduct was rewired onto;
 *  - categories from the catalogue tree, fetched once and filtered in the
 *    browser. It is the same tree the nav holds and it is small, so matching
 *    it here costs nothing and spares a request per keystroke.
 */

/** Below this, a term matches most of the catalogue and the list is noise. */
const MIN_CHARS = 2;
/** Long enough to swallow a burst of typing, short enough not to feel laggy. */
const DEBOUNCE_MS = 250;
const MAX_PRODUCTS = 6;
/** Categories are the broader destination, so a few go above the products. */
const MAX_CATEGORIES = 3;

const HeaderSearch = () => {
  const [term, setTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  // the shopper pressed Escape or clicked away: keep the term, drop the list
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);

  // the whole visible tree, flat, fetched once
  const tree = useRef([]);
  const box = useRef(null);
  const history = useHistory();

  const storeCode = (window._env_ && window._env_.APP_MERCHANT) || "";
  const lang = localStorage.getItem("lang") || "en";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchCategoryTree(storeCode, lang);
        if (!cancelled && res && res.categories) {
          // flattened, so a sub-category is suggestible too: "shankh" should
          // find Shankh, which sits under Pooja Products
          tree.current = flattenCategories(visibleCategories(res.categories));
        }
      } catch (e) {
        tree.current = [];
      }
    };
    load();
    return () => { cancelled = true; };
  }, [storeCode, lang]);

  useEffect(() => {
    const q = term.trim();
    setActive(-1);
    if (q.length < MIN_CHARS) {
      setProducts([]);
      setCategories([]);
      return;
    }

    // categories are already in hand, so they appear on the first keystroke
    // rather than waiting on the network
    const needle = q.toLowerCase();
    setCategories(
      tree.current
        .filter(c => ((c.description && c.description.name) || "").toLowerCase().includes(needle))
        .slice(0, MAX_CATEGORIES)
    );

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await WebService.get(
          constant.ACTION.PRODUCTS + "?store=" + storeCode + "&lang=" + lang
          + "&count=" + MAX_PRODUCTS + "&name=" + encodeURIComponent(q)
        );
        // a slower earlier request must not overwrite a newer one
        if (!cancelled) setProducts((res && res.products) || []);
      } catch (e) {
        if (!cancelled) setProducts([]);
      }
    }, DEBOUNCE_MS);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [term, storeCode, lang]);

  // One list behind the two headings, so the arrow keys run straight down the
  // dropdown instead of treating each section as its own little world.
  const items = [
    ...categories.map(c => ({
      key: "c" + c.id,
      label: (c.description && c.description.name) || c.code,
      to: "/category/" + ((c.description && c.description.friendlyUrl) || c.code)
    })),
    ...products.map(p => ({
      key: "p" + p.id,
      label: (p.description && p.description.name) || p.sku,
      to: "/product/" + ((p.description && p.description.friendlyUrl) || p.id),
      image: p.image && p.image.imageUrl
    }))
  ];
  const showing = !dismissed && term.trim().length >= MIN_CHARS && items.length > 0;

  useEffect(() => {
    if (!showing) return;
    const away = e => { if (box.current && !box.current.contains(e.target)) setDismissed(true); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [showing]);

  const go = to => {
    setDismissed(true);
    setTerm("");
    history.push(to);
  };

  const submit = e => {
    e.preventDefault();
    if (showing && active >= 0) return go(items[active].to);
    const q = term.trim();
    if (!q) return;
    setDismissed(true);
    setTerm("");
    history.push("/search/" + encodeURIComponent(q));
  };

  const onKeyDown = e => {
    if (e.key === "Escape") return setDismissed(true);
    if (!showing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(active + 1 >= items.length ? 0 : active + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(active <= 0 ? items.length - 1 : active - 1);
    }
  };

  return (
    <div className="header-search-wrap" ref={box}>
      <form onSubmit={submit} role="search" autoComplete="off">
        <input
          type="search"
          value={term}
          onChange={e => { setTerm(e.target.value); setDismissed(false); }}
          onKeyDown={onKeyDown}
          onFocus={() => setDismissed(false)}
          placeholder="Search for products..."
          aria-label="Search for products"
          /* combobox, because aria-expanded is only meaningful on a role
             that can own a popup; a bare search input cannot */
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showing}
          aria-controls="header-search-suggestions"
        />
        <button type="submit" aria-label="Search">
          <i className="fa fa-search" />
        </button>

        {showing && (
          <ul id="header-search-suggestions" className="header-search__suggestions" role="listbox">
            {categories.length > 0 && (
              <li className="header-search__group" aria-hidden="true">Categories</li>
            )}
            {items.map((item, index) => (
              <React.Fragment key={item.key}>
                {index === categories.length && products.length > 0 && (
                  <li className="header-search__group" aria-hidden="true">Products</li>
                )}
                <li
                  role="option"
                  aria-selected={index === active}
                  className={
                    "header-search__option" + (index === active ? " is-active" : "")
                  }
                  /* mousedown, not click: the outside-click listener fires on
                     mousedown and would close the list before a click landed */
                  onMouseDown={e => { e.preventDefault(); go(item.to); }}
                  onMouseEnter={() => setActive(index)}
                >
                  {item.image && <img src={item.image} alt="" aria-hidden="true" />}
                  <span>{item.label}</span>
                </li>
              </React.Fragment>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
};

export default HeaderSearch;
