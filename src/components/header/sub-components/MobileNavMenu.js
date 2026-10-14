import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { multilanguage } from "redux-multilanguage";
import { connect } from "react-redux";
import { setCategoryID } from "../../../redux/actions/productActions";
import { setContent } from "../../../redux/actions/contentAction";
import { CATEGORY_PAGE_LINKS } from "../NavMenu";

// the hand-picked promotional category, shown as a highlighted pill
const SPECIAL_CATEGORY_CODE = "special";
const MobileNavMenu = ({ strings, categories, contents, setCategoryID, setContent }) => {
  const onClickCategory = (item) => {
    setCategoryID(item.id)
  }
  const onClickContent = (item) => {
    setContent(item)
  }
  // console.log(contents);
  return (
    <nav className="offcanvas-navigation" id="offcanvas-navigation">
      <ul>
        <li className="menu-item">
          <Link to={"/"}>Home</Link>
        </li>

        {
          categories.map((item, index) => {

            return item.visible && <li className={"menu-item-has-children" + (item.code === SPECIAL_CATEGORY_CODE ? " nav-special" : "")} key={index}>
              <Link to={"/category/" + item.description.friendlyUrl} onClick={() => onClickCategory(item)}>
                {item.code === SPECIAL_CATEGORY_CODE
                  ? <span className="nav-special__pill"><span className="nav-special__star" aria-hidden="true">★</span>{item.description.name}</span>
                  : item.description.name}
              </Link>
              {
                item.children && item.children.length > 0 &&
                <ul className="sub-menu">
                  {
                    item.children.map((submenu, j) => {
                      return (
                        <li className="menu-item-has-children" key={j}>
                          <Link to={"/category/" + submenu.description.friendlyUrl} onClick={() => onClickCategory(submenu)}>
                            {strings[submenu.description.name] ? strings[submenu.description.name] : submenu.description.name}
                          </Link>
                        </li>
                      )
                    })
                  }
                  {/* Same non-category page links as the desktop mega-menu --
                      the mobile drawer is a separate component, so leaving it
                      out here made the link desktop-only. */}
                  {(CATEGORY_PAGE_LINKS[item.code] || []).map(link => (
                    <li className="nav-page-link" key={link.to}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              }
            </li>

          })
        }
        {
          contents.map((content, index) => {
            return (
              content.visible && content.description &&
              <li key={index}> <Link to={"/content/" + content.description.friendlyUrl} onClick={() => onClickContent(content.code)}>{content.description.name}</Link></li>
            )
          })
        }

      </ul>
    </nav>
  );
};

MobileNavMenu.propTypes = {
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
export default connect(null, mapDispatchToProps)(multilanguage(MobileNavMenu));
// export default multilanguage(MobileNavMenu);
