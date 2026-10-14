import PropTypes from "prop-types";
import React from "react";
import SectionTitle from "../../components/section-title/SectionTitle";

/**
 * "Our Trending Videos" -- the section divineshopee.com runs between the
 * product grid and the trust badges.
 *
 * No video URLs were available when this was built, so it renders clearly
 * labelled placeholders rather than inventing content. To go live, drop entries
 * into VIDEOS; the moment the array is non-empty the placeholders disappear and
 * each entry renders as a real embed. Nothing else needs to change.
 *
 *   const VIDEOS = [
 *     { title: "5 Mukhi Rudraksha", url: "https://www.youtube.com/watch?v=XXXXXXXXXXX" }
 *   ];
 */
const VIDEOS = [];

// how many empty tiles to show while VIDEOS is empty; matches the 3-up row
const PLACEHOLDER_COUNT = 3;

// accepts watch, youtu.be and embed URLs, since which one gets pasted varies
const toEmbedUrl = url => {
  const match = String(url).match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

const TrendingVideos = ({ spaceTopClass, spaceBottomClass }) => {
  const tiles = VIDEOS.length
    ? VIDEOS
    : Array.from({ length: PLACEHOLDER_COUNT }, () => null);

  return (
    <div
      className={`trending-video-area ${spaceTopClass ? spaceTopClass : ""} ${
        spaceBottomClass ? spaceBottomClass : ""
      }`}
    >
      <div className="container">
        <SectionTitle titleText="Our Trending Videos" positionClass="text-center" />
        <div className="row pt-30">
          {tiles.map((video, index) => (
            <div className="col-lg-4 col-md-6 col-12" key={index}>
              <div className="trending-video">
                {video ? (
                  <iframe
                    className="trending-video__frame"
                    src={toEmbedUrl(video.url)}
                    title={video.title || `Trending video ${index + 1}`}
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <div className="trending-video__placeholder">
                    <i className="fa fa-play-circle trending-video__placeholder-icon" />
                    <span className="trending-video__placeholder-text">
                      Video {index + 1} &mdash; add a YouTube URL to VIDEOS in
                      TrendingVideos.js
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

TrendingVideos.propTypes = {
  spaceBottomClass: PropTypes.string,
  spaceTopClass: PropTypes.string
};

export default TrendingVideos;
