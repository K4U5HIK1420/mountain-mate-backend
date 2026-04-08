import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://mountainmate.in";
const SITE_NAME = "Mountain Mate";
const DEFAULT_IMAGE = `${SITE_URL}/branding/mountain-mate-share-banner.jpg`;
const TWITTER_HANDLE = "@mountainmate";
const DEFAULT_DESCRIPTION =
  "Book verified stays, trusted rides, and smarter Uttarakhand trip plans from one platform.";
const DEFAULT_KEYWORDS =
  "Mountain Mate, Uttarakhand travel, Uttarakhand stays, Uttarakhand rides, Kedarnath travel, Badrinath travel, Char Dham travel, mountain trip planner";

const SEO_BY_ROUTE = {
  "/": {
    title: "Mountain Mate | Verified Uttarakhand Stays, Rides and Trip Planner",
    description:
      "Book verified stays, trusted rides, and smarter Uttarakhand trip plans from one platform built for mountain travel.",
    keywords:
      "Mountain Mate, Uttarakhand travel planner, verified stays Uttarakhand, trusted rides Uttarakhand, Kedarnath booking, Badrinath trip planning",
  },
  "/explore-stays": {
    title: "Explore Stays | Verified Mountain Hotels in Uttarakhand | Mountain Mate",
    description:
      "Find verified stays in Kedarnath, Guptkashi, Sonprayag, Auli, Badrinath and more with cleaner search and faster booking flow.",
    keywords:
      "Uttarakhand hotels, mountain stays, Kedarnath hotels, Guptkashi stays, Sonprayag hotels, Auli stays, Badrinath accommodation",
  },
  "/explore-rides": {
    title: "Explore Rides | Trusted Uttarakhand Travel Rides | Mountain Mate",
    description:
      "Search trusted rides for Uttarakhand routes with cleaner booking, route clarity, and better mountain travel coordination.",
    keywords:
      "Uttarakhand rides, Kedarnath taxi, Badrinath cab, mountain transport, Rishikesh to Kedarnath ride, Uttarakhand taxi booking",
  },
  "/planner": {
    title: "Trip Planner | Uttarakhand Itinerary Builder | Mountain Mate",
    description:
      "Build a smarter Uttarakhand itinerary with route suggestions, travel alerts, stay planning, and ride coordination in one place.",
    keywords:
      "Uttarakhand itinerary planner, Kedarnath itinerary, Badrinath itinerary, mountain travel planner, Char Dham planner",
  },
  "/recommendations": {
    title: "Travel Recommendations | Uttarakhand Picks | Mountain Mate",
    description:
      "Discover curated Uttarakhand stay and travel recommendations tailored for mountain routes, budget, and travel style.",
    keywords:
      "Uttarakhand recommendations, mountain stays, travel suggestions, Kedarnath stay recommendations, Himalayan travel options",
  },
  "/support": {
    title: "Support | Mountain Mate",
    description:
      "Reach Mountain Mate support for booking help, travel coordination, and trip assistance.",
    keywords: "Mountain Mate support, booking help, travel assistance",
  },
  "/register-partner": {
    title: "Partner With Mountain Mate | List Your Stay or Ride",
    description:
      "Join Mountain Mate as a verified partner and list your stay or ride service for Uttarakhand travelers.",
    keywords:
      "list hotel Uttarakhand, list taxi Uttarakhand, travel partner registration, Mountain Mate partner",
  },
  "/login": {
    title: "Login | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/register": {
    title: "Register | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/reset-password": {
    title: "Reset Password | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/bookings": {
    title: "My Bookings | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/manage-stays": {
    title: "Manage Stays | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/manage-rides": {
    title: "Manage Rides | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/add-hotel": {
    title: "Add Stay | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/add-transport": {
    title: "Add Ride | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/profile": {
    title: "Profile | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/admin-mate": {
    title: "Admin Console | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/admin-bookings": {
    title: "Admin Bookings | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
  "/admin-support": {
    title: "Admin Support | Mountain Mate",
    description: DEFAULT_DESCRIPTION,
    robots: "noindex, nofollow",
  },
};

function getSeoConfig(pathname) {
  if (pathname.startsWith("/booking/")) {
    return {
      title: "Booking Confirmation | Mountain Mate",
      description: DEFAULT_DESCRIPTION,
      robots: "noindex, nofollow",
    };
  }

  if (pathname.startsWith("/payment/")) {
    return {
      title: "Payment Status | Mountain Mate",
      description: DEFAULT_DESCRIPTION,
      robots: "noindex, nofollow",
    };
  }

  return (
    SEO_BY_ROUTE[pathname] || {
      title: `${SITE_NAME} | Uttarakhand Travel Platform`,
      description: DEFAULT_DESCRIPTION,
      keywords: DEFAULT_KEYWORDS,
    }
  );
}

export default function SeoManager() {
  const location = useLocation();
  const { pathname } = location;
  const seo = getSeoConfig(pathname);
  const title = seo.title || `${SITE_NAME} | Uttarakhand Travel Platform`;
  const description = seo.description || DEFAULT_DESCRIPTION;
  const keywords = seo.keywords || DEFAULT_KEYWORDS;
  const robots = seo.robots || "index, follow";
  const canonicalUrl = `${SITE_URL}${pathname === "/" ? "" : pathname}`;

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/explore-stays?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/mountain-mate-badge.png`,
    sameAs: [SITE_URL],
  };

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={DEFAULT_IMAGE} />
      <meta property="og:image:secure_url" content={DEFAULT_IMAGE} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1600" />
      <meta property="og:image:height" content="900" />
      <meta property="og:image:alt" content="Mountain Mate travel planning banner" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_IMAGE} />
      <meta name="twitter:image:alt" content="Mountain Mate travel planning banner" />

      <link rel="canonical" href={canonicalUrl} />

      <script id="mm-website-schema" type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script id="mm-organization-schema" type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
}
