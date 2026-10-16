import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { multilanguage } from "redux-multilanguage";
import { connect } from "react-redux";

import { setCategoryID } from "../../redux/actions/productActions";
import { setContent } from "../../redux/actions/contentAction";
// Shared with the shop facet so the menu and the sidebar cannot drift apart.
import { sortCategoriesByOrder as bySortOrder } from "../../helpers/product";

// the hand-picked promotional category, shown as a highlighted pill
const SPECIAL_CATEGORY_CODE = "special";

// A category with more children than this gets a grid mega-menu instead of a
// single tall dropdown. Rudraksha has 23 sub-categories (1-18 Mukhi plus the
// named ones), which is unusable as one column.
const MEGA_MENU_THRESHOLD = 8;
// The theme's ul.mega-menu styles its direct <li> children at 33.33% width,
// so three columns is what the existing CSS is built for.
const MEGA_MENU_COLUMNS = 3;

// Pages that belong under a category's menu but are not categories themselves.
// Keyed by category code so nothing else in the menu is affected.
export const CATEGORY_PAGE_LINKS = {
  rudraksha: [
    { label: "\u2b50 Rudraksha Recommendation \u2b50", to: "/rudraksha-recommendation" }
  ]
};

/** Split a list into n balanced columns, preserving order down each column. */
const toColumns = (items, n) => {
  const perColumn = Math.ceil(items.length / n);
  const columns = [];
  for (let i = 0; i < items.length; i += perColumn) {
    columns.push(items.slice(i, i + perColumn));
  }
  return columns;
};
const NavMenu = ({ props, strings, menuWhiteClass, sidebarMenu, categories, contents, setCategoryID, setContent }) => {

  const onClickCategory = (item) => {
    setCategoryID(item.id)
  }
  const onClickContent = (item) => {
    setContent(item)
  }
  const pageLinksFor = (item) => CATEGORY_PAGE_LINKS[item.code] || [];
  return (
    <div
      className={` ${
        sidebarMenu
          ? "sidebar-menu"
          : `main-menu ${menuWhiteClass ? menuWhiteClass : ""}`
        } `}
    >
      <nav>
        {/* Row 1: category navigation */}
        <ul>
          <li>
            <Link to={"/"}>
              {strings["Home"]}
            </Link>
          </li>
          {
            categories.map((item, index) => {
              return (
                item.visible &&
                <li key={index} className={item.code === SPECIAL_CATEGORY_CODE ? "nav-special" : undefined}>
                  <Link to={"/category/" + item.description.friendlyUrl} onClick={() => onClickCategory(item)}>
                    {item.code === SPECIAL_CATEGORY_CODE
                      ? <span className="nav-special__pill"><span className="nav-special__star" aria-hidden="true">★</span>{item.description.name}</span>
                      : item.description.name}
                    {item.children && item.children.length > 0 ?
                      sidebarMenu ? (
                        <span>
                          <i className="fa fa-angle-right"></i>
                        </span>
                      ) : (
                          <i className="fa fa-angle-down" />
                        )
                      : ''
                    }

                  </Link>
                  {
                    item.children && item.children.length > 0 && (
                      // Sidebar/mobile keeps the plain stacked list -- the theme's
                      // mega-menu is absolutely positioned and 700px wide, which
                      // only works for the desktop header.
                      !sidebarMenu && item.children.length > MEGA_MENU_THRESHOLD ? (
                        <ul className="mega-menu mega-menu-padding">
                          {
                            toColumns(bySortOrder(item.children), MEGA_MENU_COLUMNS).map((column, colIndex) => (
                              <li key={colIndex}>
                                <ul>
                                  {
                                    column.map((submenu, subIndex) => (
                                      <li key={subIndex}>
                                        <Link
                                          to={"/category/" + submenu.description.friendlyUrl}
                                          onClick={() => onClickCategory(submenu)}
                                        >
                                          {submenu.description.name}
                                        </Link>
                                      </li>
                                    ))
                                  }
                                </ul>
                              </li>
                            ))
                          }
                          {/* Full-width row under the columns, as on the source
                              site: a centred pill so it reads as an action
                              rather than a 24th bead type. */}
                          {pageLinksFor(item).map(link => (
                            <li key={link.to} className="mega-menu__page-link">
                              <Link to={link.to}>{link.label}</Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="submenu">
                          {
                            bySortOrder(item.children).map((submenu, subIndex) => (
                              <li key={subIndex}>
                                <Link
                                  to={"/category/" + submenu.description.friendlyUrl}
                                  onClick={() => onClickCategory(submenu)}
                                >
                                  {submenu.description.name}
                                </Link>
                              </li>
                            ))}
                          {
                            pageLinksFor(item).map(link => (
                              <li key={link.to} className="nav-page-link">
                                <Link to={link.to}>{link.label}</Link>
                              </li>
                            ))
                          }
                        </ul>
                      )
                    )
                  }
                </li>
              )
            })
          }
        </ul>
      </nav>
    </div>
  );
};

NavMenu.propTypes = {
  menuWhiteClass: PropTypes.string,
  sidebarMenu: PropTypes.bool,
  strings: PropTypes.object
};
const mapDispatchToProps = dispatch => {
  return {
    setCategoryID: (value) => {
      dispatch(setCategoryID(value));
    },
    setContent: (value) => {
      dispatch(setContent(value));
    }
  };
};
export default connect(null, mapDispatchToProps)(multilanguage(NavMenu));
// export default multilanguage(NavMenu);
