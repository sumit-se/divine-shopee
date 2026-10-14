import React from "react";
import { NavLink } from "react-router-dom";
import { Breadcrumbs } from "react-breadcrumbs-dynamic";

/*
 * The page you are already on is not a link, but the library still hands the
 * final crumb a `to` prop -- React then warns about an unknown attribute on a
 * span and puts `to="/product/..."` in the markup. Dropping it here keeps the
 * label and leaves the DOM clean.
 */
const FinalCrumb = ({ to, ...rest }) => <span {...rest} />;

const Breadcrumb = () => {
  return (
    <div className="breadcrumb-area pt-35 pb-35 bg-gray-3">
      <div className="container">
        <div className="breadcrumb-content text-center">
          <Breadcrumbs
            separator={<span className="breadcrumb-separator">/</span>}
            item={NavLink}
            finalItem={FinalCrumb}
          />
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
