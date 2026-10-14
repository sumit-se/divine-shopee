import PropTypes from "prop-types";
import React from "react";
import { sortCategoriesByOrder } from "../../helpers/product";
// import { setActiveSort } from "../../helpers/product";

const ShopCategories = ({ categories, getCategoryParams, string, activeCategoryId }) => {
  return (
    <div className="sidebar-widget">
      <h4 className="pro-sidebar-title">{string["Categories"]}</h4>
      <div className="sidebar-widget-list mt-20">
        {categories.length > 0 ? (
          <ul>

            {/* The API returns children alphabetically, which reads
                1, 10, 11, ... 2, 3 in this list. Sorted here rather than in
                the two callers (Category and SearchProduct) so both the
                category facet and the search facet stay in step. */}
            {sortCategoriesByOrder(categories).map((category, key) => {
              return (
                <li key={key}>
                  <div>

                    {/* <label>
                      <input
                        type="checkbox"
                        value={category.id}
                        name="category"
                        // checked={checkedOrNot(singleSize)}
                        onChange={(e) => {
                          getCategoryParams("category", category.id);
                        }}
                      />
                      <span className="checkmark" />{category.description.name}{" "}
                    </label> */}
                    {/* aria-pressed, not a link: on the search page this
                        narrows the results in place rather than navigating,
                        and the pressed state is the only thing telling the
                        shopper which facet is on. Harmless on the category
                        page, where activeCategoryId is never passed. */}
                    <button
                      type="button"
                      aria-pressed={activeCategoryId === category.id}
                      className={activeCategoryId === category.id ? "is-active" : ""}
                      onClick={e => {
                        getCategoryParams("category", category);
                      }}> {category.description.name}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
            "No categories found"
          )}
      </div>
    </div>
  );
};

ShopCategories.propTypes = {
  categories: PropTypes.array,
  getSortParams: PropTypes.func
};

export default ShopCategories;
