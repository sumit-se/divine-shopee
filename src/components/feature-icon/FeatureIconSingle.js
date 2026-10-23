import PropTypes from "prop-types";
import React from "react";

const FeatureIconSingle = ({ data, spaceBottomClass }) => {
  const isExternal = data.iconImage && data.iconImage.startsWith("http");
  const iconSrc = isExternal ? data.iconImage : process.env.PUBLIC_URL + data.iconImage;
  return (
    <div className="col-lg-2 col-md-4 col-sm-6">
      <div
        className={`support-wrap-3 text-center ${
          spaceBottomClass ? spaceBottomClass : ""
          }`}
        style={{ backgroundColor: `${data.backgroundColor}` }}
      >
        <div className="support-icon-2">
          <img
            className="animated"
            src={iconSrc}
            alt={data.title}
          />
        </div>
        <div className="support-content-3">
          <h5 className="support-title-text">{data.title}</h5>
          <p>{data.subTitle || data.title}</p>
        </div>
      </div>
    </div>
  );
};

FeatureIconSingle.propTypes = {
  data: PropTypes.object,
  spaceBottomClass: PropTypes.string
};

export default FeatureIconSingle;
