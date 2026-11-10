import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

const GAPageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (window._env_?.APP_GA_MEASUREMENT_ID) {
      ReactGA.send({
        hitType: "pageview",
        page: location.pathname + location.search,
        title: document.title,
      });
    }
  }, [location]);

  return null;
};

export default GAPageTracker;
