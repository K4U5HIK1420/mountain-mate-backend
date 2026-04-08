const GTM_ID = (import.meta.env.VITE_GTM_ID || "").trim();
const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();
const ENABLE_ANALYTICS = Boolean(GTM_ID || GA_MEASUREMENT_ID);

function ensureDataLayer() {
  if (typeof window === "undefined") return [];
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

function injectScript(src, id) {
  if (typeof document === "undefined") return;
  if (id && document.getElementById(id)) return;

  const script = document.createElement("script");
  if (id) script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

export function initializeAnalytics() {
  if (!ENABLE_ANALYTICS || typeof window === "undefined") return;

  const dataLayer = ensureDataLayer();

  if (GTM_ID && !window.__mm_gtm_initialized) {
    dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`, "mm-gtm-script");
    window.__mm_gtm_initialized = true;
  }

  if (GA_MEASUREMENT_ID && !window.__mm_ga_initialized) {
    injectScript(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`,
      "mm-ga-script"
    );
    window.gtag =
      window.gtag ||
      function gtag() {
        ensureDataLayer().push(arguments);
      };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
    window.__mm_ga_initialized = true;
  }
}

export function trackPageView({ path, title, location }) {
  if (!ENABLE_ANALYTICS || typeof window === "undefined") return;

  const payload = {
    event: "page_view",
    page_path: path,
    page_title: title,
    page_location: location,
  };

  ensureDataLayer().push(payload);

  if (typeof window.gtag === "function" && GA_MEASUREMENT_ID) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title,
      page_location: location,
    });
  }
}

export function trackEvent(eventName, params = {}) {
  if (!ENABLE_ANALYTICS || typeof window === "undefined" || !eventName) return;

  const normalizedName = String(eventName).trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  const payload = { event: normalizedName, ...params };

  ensureDataLayer().push(payload);

  if (typeof window.gtag === "function" && GA_MEASUREMENT_ID) {
    window.gtag("event", normalizedName, params);
  }
}

export function getAnalyticsConfig() {
  return {
    gtmId: GTM_ID,
    gaMeasurementId: GA_MEASUREMENT_ID,
    enabled: ENABLE_ANALYTICS,
  };
}
