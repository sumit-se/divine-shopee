import PropTypes from "prop-types";
import React, { Fragment, useEffect, useState } from "react";
import { LightgalleryProvider, LightgalleryItem } from "react-lightgallery";

import Swiper from "react-id-swiper";
import SaleTag from "./SaleTag";
import 'swiper/swiper.scss'

//import { Swiper } from 'swiper/react';
//import 'swiper/swiper.scss';

/*
 * `images` is the page's gallery: the chosen bead's own photos (flagged
 * `variantImage`) followed by the product's. `startIndex` is the photo to open
 * on -- the product's main photo while the bead is only the default selection,
 * the bead's photo once the shopper picks it. The parent remounts this
 * component (via `key`) whenever either changes.
 */
// the YouTube id in a product video's address (stored as a watch URL)
const youTubeId = (url) => {
  const m = String(url || "").match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

const ProductImageGallery = ({ product, images: galleryImages, startIndex, strings, salePrice }) => {
  const allImages =
    galleryImages && galleryImages.length > 0 ? galleryImages : product.images || [];
  /*
   * A photo whose file has gone missing is dropped from the gallery rather than
   * drawn as a broken frame, and its thumbnail with it. The store's media moved
   * to object storage and the bead photos were left behind in the move; until
   * they are uploaded again a bead simply shows the product's own photos, which
   * is what a bead with no photo of its own has always done.
   */
  const [missing, setMissing] = useState(() => new Set());
  const markMissing = url =>
    setMissing(previous => (previous.has(url) ? previous : new Set(previous).add(url)));
  const images = allImages.filter(image => !missing.has(image.imageUrl));
  const start = startIndex > 0 && startIndex < images.length ? startIndex : 0;
  const [currentImage, setCurrentImage] = useState(images.length > 0 ? images[start].imageUrl : "")
  const current = images.find(image => image.imageUrl === currentImage);
  // the photo on show was the one that failed: move to whatever is left
  useEffect(() => {
    if (images.length > 0 && !current) {
      setCurrentImage(images[start].imageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing]);
  const yourBead = (strings && strings["Your bead"]) || "Your bead";

  /*
   * Hover to zoom: on a desktop, pointing at the main photo magnifies it inside
   * its own box, following the pointer, so a bead's surface or the small print
   * of a lab report can be read without leaving the page. Touch screens have no
   * hover; there a tap opens the full-screen viewer, which pinch-zooms.
   */
  const canHover = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const [zoom, setZoom] = useState(null); // { x, y } in % while zoomed
  const followPointer = (event) => {
    if (!canHover) return;
    const box = event.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((event.clientX - box.left) / box.width) * 100,
      y: ((event.clientY - box.top) / box.height) * 100
    });
  };
  const enlarge = (strings && strings["Click to enlarge"]) || "Click to enlarge";

  const thumbnailSwiperParams = {
    spaceBetween: 10,
    slidesPerView: 4,
    loopedSlides: 4,
    touchRatio: 0.2,
    freeMode: true,
    loop: false,
    slideToClickedSlide: true,
    navigation: {
      nextEl: images.length > 4 ? ".swiper-button-next" : '',
      prevEl: images.length > 4 ? ".swiper-button-prev" : ''
    },
    renderPrevButton: () => (
      <button className="swiper-button-prev ht-swiper-button-nav">
        <i className="pe-7s-angle-left" />
      </button>
    ),
    renderNextButton: () => (
      <button className="swiper-button-next ht-swiper-button-nav">
        <i className="pe-7s-angle-right" />
      </button>
    )
  };

  return (
    <Fragment>
      <div className="product-large-image-wrapper">
        {/* {product.discount || product.new ? (
          <div className="product-img-badges">
            {product.discount ? (
              <span className="pink">-{product.discount}%</span>
            ) : (
              ""
            )}
            {product.new ? <span className="purple">New</span> : ""}
          </div>
        ) : (
          ""
        )} */}
        {/*
          Every photo is an item of the full-screen viewer, in gallery order,
          so clicking opens it on the photo being shown and the arrows go
          through the rest. Only the current one is visible. (The expand icon
          used to open the viewer on the first photo whatever was on screen.)
        */}
        <LightgalleryProvider>
          {current && current.videoUrl && youTubeId(current.videoUrl) && (
            /*
             * A product video plays where the photo would be. It is not an item
             * of the full-screen viewer, which only shows pictures. The
             * no-cookie player keeps YouTube from tracking visitors who do not
             * press play.
             */
            <div className="single-image product-video">
              <iframe
                src={"https://www.youtube-nocookie.com/embed/" + youTubeId(current.videoUrl) + "?rel=0&modestbranding=1&playsinline=1"}
                title={(product.description ? product.description.name + " – " : "") + ((strings && strings["Video"]) || "Video")}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {images.filter(single => !single.videoUrl).map((single, key) => {
            const isCurrent = single.imageUrl === currentImage;
            return (
              <LightgalleryItem
                key={key}
                group="product"
                src={single.imageUrl}
                itemClassName={isCurrent ? "lg-current-photo" : "lg-hidden-photo"}
              >
                {isCurrent && (
                  <div
                    className={"single-image zoomable" + (zoom ? " zoomed" : "")}
                    title={enlarge}
                    onMouseEnter={followPointer}
                    onMouseMove={followPointer}
                    onMouseLeave={() => setZoom(null)}
                  >
                    {salePrice && <SaleTag {...salePrice} strings={strings} />}
                    <img
                      src={single.imageUrl}
                      className="img-fluid"
                      alt={product.description ? product.description.name : ""}
                      onError={() => markMissing(single.imageUrl)}
                      style={zoom ? { transformOrigin: zoom.x + "% " + zoom.y + "%" } : undefined}
                    />
                    <span className="enlarge-hint" aria-hidden="true">
                      <i className="pe-7s-expand1"></i>
                    </span>
                  </div>
                )}
              </LightgalleryItem>
            );
          })}
        </LightgalleryProvider>
      </div>
      {/* a caption rather than an overlay: photos are fitted into a fixed box,
          so a corner badge could land in the empty band above a wide one */}
      {current && current.variantImage && (
        <p className="your-bead-caption">{yourBead}</p>
      )}
      <div className="product-small-image-wrapper mt-15">
        <Swiper {...thumbnailSwiperParams}>
          {images.length > 1 &&
            images.map((single, key) => {
              return (
                <div key={key}>
                  <div className={"single-image" + (single.imageUrl === currentImage ? " active" : "")}>
                    {single.variantImage && <span className="your-bead-badge">{yourBead}</span>}
                    {single.videoUrl && <span className="video-play-badge" aria-label="Video">▶</span>}
                    <img
                      onClick={() => setCurrentImage(single.imageUrl)}
                      src={single.imageUrl}
                      className="img-fluid"
                      alt=""
                      onError={() => markMissing(single.imageUrl)}
                    />
                  </div>
                </div>
              );
            })}
        </Swiper>
      </div>
    </Fragment>
  );
};

ProductImageGallery.propTypes = {
  product: PropTypes.object,
  images: PropTypes.array,
  startIndex: PropTypes.number,
  strings: PropTypes.object,
  salePrice: PropTypes.object
};

export default ProductImageGallery;
