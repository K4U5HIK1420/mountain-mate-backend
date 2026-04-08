import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { getAnalyticsConfig, initializeAnalytics, trackPageView } from "../utils/analytics";

export default function AnalyticsManager() {
  const location = useLocation();
  const { enabled, gtmId } = getAnalyticsConfig();

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    trackPageView({
      path: `${location.pathname}${location.search}${location.hash}`,
      title: document.title,
      location: window.location.href,
    });
  }, [enabled, location.pathname, location.search, location.hash]);

  if (!enabled || !gtmId || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <noscript>
      <iframe
        title="Google Tag Manager"
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>,
    document.body
  );
}
