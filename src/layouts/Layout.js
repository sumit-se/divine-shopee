import PropTypes from "prop-types";
import React, { Fragment } from "react";
import AnnouncementBar from "../components/announcement/AnnouncementBar";
import Header from "../wrappers/header/Header";
import Footer from "../wrappers/footer/Footer";

const Layout = ({
  children,
  headerContainerClass,
  headerTop,
  headerPaddingClass,
  headerPositionClass
}) => {
  return (
    <Fragment>
      {/* sits above the header on every page, as on the previous site */}
      <AnnouncementBar />
      <Header
        layout={headerContainerClass}
        top={headerTop}
        headerPaddingClass={headerPaddingClass}
        headerPositionClass={headerPositionClass}
      />
      {children}
      {/* bg-gray / pt-100 / pb-70 dropped: the brand footer paints its own
          black band and orange rights strip and owns its vertical rhythm. */}
      <Footer />
    </Fragment>
  );
};

Layout.propTypes = {
  children: PropTypes.any,
  headerContainerClass: PropTypes.string,
  headerPaddingClass: PropTypes.string,
  headerPositionClass: PropTypes.string,
  headerTop: PropTypes.string
};

export default Layout;
