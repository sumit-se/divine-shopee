import React, { Fragment } from "react";
import MetaTags from "react-meta-tags";
import Layout from "../../layouts/Layout";
import { canonicalUrl } from "../../util/seo";

import HeroSlider from "../../wrappers/hero-slider/HeroSlider";
import HeroCarousel from "../../wrappers/hero-carousel/HeroCarousel";
import TabProduct from "../../wrappers/product/TabProduct";
import CategoryCarousel from "../../wrappers/category/CategoryCarousel";
import ExperienceBanner from "../../wrappers/banner/ExperienceBanner";
import FeatureIcon from "../../wrappers/feature-icon/FeatureIcon";
import TrendingVideos from "../../wrappers/trending-videos/TrendingVideos";
import { multilanguage } from "redux-multilanguage";
import { connect } from "react-redux";
// ~150 characters, drawn from the store's own intro copy rather than invented.
const HOME_META_DESCRIPTION =
  "Buy certified Rudraksha, jaap malas, gemstones and pooja essentials at " +
  "Divine Shopee. Authentic, lab-tested and shipped across India.";

const Home = ({ merchant, strings }) => {
  return (
    <Fragment>
      <MetaTags>
          <link rel="canonical" href={canonicalUrl()} />
        {/*
          The title stays data-driven off merchant.name, with a descriptive tail
          so the tab and the search result say what the shop actually sells.

          The description was previously never set here, so every visitor and
          crawler got the theme's leftover boilerplate from public/index.html
          ("Imports from the world"). Kept close to 155 characters, which is
          roughly where Google truncates.
        */}
        <title>{merchant.name} | Certified Rudraksha, Malas &amp; Gemstones</title>
        <meta name="description" content={HOME_META_DESCRIPTION} />
      </MetaTags>
      <Layout
        headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-2"
        headerTop="visible"
      >
        {/* Banner carousel, as the previous site runs above its intro copy. */}
        <HeroCarousel spaceTopClass="pt-30" spaceBottomClass="pb-20" />
        {/* intro copy + artwork */}
        <HeroSlider string={strings} />
        {/* "Divine Shopee Experience" banner. This is the slot the theme's Promo
            block used to occupy (a stock furniture banner, deleted -- copies in
            backups/removed-promo/), and it is where the previous site runs this
            artwork too: straight after the hero, ahead of the products. */}
        <ExperienceBanner spaceTopClass="pt-60" />

        {/* shop-by-category carousel */}
        <CategoryCarousel spaceTopClass="pt-60" spaceBottomClass="pb-60" />

        {/* tab product */}
        {/* Same 60/60 rhythm as the category strip above: these two sections
            sit flush against each other, and 20-bottom against 100-top made
            the spacing above and below the category strip visibly uneven. */}
        <TabProduct
          category="fashion"
          spaceBottomClass="pb-60"
          spaceTopClass="pt-60"
        />
        {/* The previous site runs this between the product grid and the trust
            badges. Placeholders for now -- see TrendingVideos.js. */}
        <TrendingVideos spaceTopClass="pt-60" spaceBottomClass="pb-60" />
        {/* trust badges -- The previous site carries these directly above the
            footer: Free Shipping, Secure Payments, Trusted Brand, Happy &
            Satisfied. The theme shipped this section commented out.
            containerClass is `container`, not the theme's `container-fluid`:
            as fluid these badges started at x=10 while every other section on
            the page starts at x=55. */}
        <FeatureIcon
          bgImg="/assets/img/bg/shape.png"
          containerClass="container"
          gutterClass="padding-10-row-col"
          spaceTopClass="pt-50"
          spaceBottomClass="pb-40"
        />
        {/* The theme's full-width "Subscribe to our newsletter!" band was
            removed: the footer's own Subscribe Now block posts to the same
            /newsletter endpoint, so this was a second copy of the same form
            on one page. The wrapper is still in wrappers/newsletter/. */}
      </Layout>
    </Fragment>
  );
};


const mapStateToProps = state => {
  return {
    merchant: state.merchantData.merchant
  };
};


export default connect(mapStateToProps, null)(multilanguage(Home));
// export default HomeFashionSeven;
