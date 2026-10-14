import React, { useEffect, useState } from "react";
import Swiper from "react-id-swiper";
import { Link } from "react-router-dom";
import "swiper/swiper.scss";

import SectionTitle from "../../components/section-title/SectionTitle";
import WebService from "../../util/webService";
import constant from "../../util/constant";
import { visibleCategories, flattenCategories } from "../../helpers/category";
import { categoryTileUrl } from "./CategoryBanner";
import { fetchCategoryTree } from "../../util/categoryTree";

/**
 * Shop-by-category carousel, mirroring the category strip on divineshopee.com.
 *
 * Reads the same tree the header nav uses. Root categories become slides; the
 * child count is surfaced so "Rudraksha" reads as a hub rather than a leaf.
 */
const CategoryCarousel = ({ spaceTopClass, spaceBottomClass }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      // store must be explicit -- the redux merchant has not resolved on first
      // paint, and an empty store= silently returns nothing.
      const storeCode = window._env_.APP_MERCHANT;
      const lang = localStorage.getItem("lang") || "en";
      try {
        const res = await fetchCategoryTree(storeCode, lang);
        if (res && res.categories) {
          // Which categories this strip shows, and in what order, is the
          // store's to decide, not this component's: the admin's "Show in
          // Shop by Category" tick is the category's `featured` flag, and the
          // Sort Order field beside it is `sortOrder`.
          //
          // Hidden first, because a category taken off the site should not
          // reappear here just because it is still flagged -- visibility is
          // the stronger statement of the two. Flattened next, so the flag
          // counts at any depth: the API nests children inside their parent,
          // and filtering the top-level array alone ignored every flagged
          // sub-category.
          //
          // Sorted on the admin's Sort Order. That number is scoped to a
          // parent -- Shankh's 3 means third among Pooja Products' children,
          // not third overall -- so two flagged children of different parents
          // can carry the same one. The sort is stable and the list arrives
          // depth-first, so they fall back to tree order rather than shuffling
          // between loads.
          //
          // No fallback when nothing is flagged: an empty strip is the honest
          // answer to "none of them", and quietly showing everything instead
          // would make the tick look broken the first time it is cleared.
          const shown = flattenCategories(visibleCategories(res.categories))
            .filter(category => category.featured)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setCategories(shown);
        }
      } catch (e) {
        setCategories([]);
      }
    };
    load();
  }, []);

  if (!categories.length) return null;

  // Three across, so the tile is wide enough for its picture to read. The
  // banners are nearly 4:1, so a tile's height is a fixed fraction of its
  // width: at six across the artwork came out 170x45, a band too thin to make
  // anything out. Three gives roughly 360x95.
  //
  // This used to show every root at once -- all six, so that none was stranded
  // outside the overflow:hidden viewport with nothing on screen to say it
  // existed. The pagination below is what makes three safe now: the roots that
  // do not fit are a bullet away and the bullets say how many there are.
  //
  // The ladder only ever narrows as the screen does. An earlier version showed
  // four at 768 against six at 1024, which was fine when tiles were text but
  // would now hand a phone-sized screen smaller pictures than a desktop.
  const perView = Math.min(categories.length, 3);
  const settings = {
    loop: false,
    slidesPerView: perView,
    spaceBetween: 20,
    grabCursor: true,
    breakpoints: {
      1024: { slidesPerView: perView },
      768: { slidesPerView: Math.min(categories.length, 2) },
      640: { slidesPerView: Math.min(categories.length, 2) },
      // one across on a phone: at two the picture is back to about 150x40
      320: { slidesPerView: 1 }
    },
    // Not every root fits now, so the strip needs to say so. Bullets rather
    // than arrows: they also show how far along the strip you are, and swiper
    // hides them when every slide is already on screen.
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      hideOnClick: false,
      dynamicBullets: false
    }
  };

  return (
    <div
      className={`category-carousel-area ${spaceTopClass ? spaceTopClass : ""} ${
        spaceBottomClass ? spaceBottomClass : ""
      }`}
    >
      <div className="container">
        <SectionTitle titleText="Shop by Category" positionClass="text-center" />
        <Swiper {...settings}>
          {categories.map(cat => {
            const d = cat.description || {};
            const kids = (cat.children || []).length;
            return (
              <div className="swiper-slide" key={cat.id}>
                <Link className="category-tile" to={"/category/" + d.friendlyUrl}>
                  {/*
                    The category's own banner artwork, cropped to the tile --
                    the same picture its page shows, so the tile previews where
                    the click lands. Roots have no parent, so the second
                    argument is left off. A category with no banner has no tile
                    either and simply shows its name: there is no longer a
                    shared photo to stand in, and a missing file would draw a
                    broken frame.
                  */}
                  {categoryTileUrl(cat.code) && (
                    <img
                      className="category-tile__figure"
                      src={categoryTileUrl(cat.code)}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                    />
                  )}
                  <span className="category-tile__name">{d.name}</span>
                  {kids > 0 && (
                    <span className="category-tile__count">{kids} categories</span>
                  )}
                </Link>
              </div>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
};

export default CategoryCarousel;
