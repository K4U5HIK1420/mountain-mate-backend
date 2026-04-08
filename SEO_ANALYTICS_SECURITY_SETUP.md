# SEO, Analytics, and Security Setup

## What is already implemented

- Dynamic SEO tags with `react-helmet-async`
- Canonical URLs per route
- Open Graph and Twitter meta tags
- JSON-LD structured data
- `robots.txt`
- `sitemap.xml`
- GA4 and GTM-ready analytics helpers
- Page view, CTA click, and conversion event tracking
- Backend security headers including CSP and HSTS in production

## Project files

- SEO manager: `frontend/src/components/SeoManager.jsx`
- Helmet provider: `frontend/src/main.jsx`
- Analytics manager: `frontend/src/components/AnalyticsManager.jsx`
- Analytics helper: `frontend/src/utils/analytics.js`
- Frontend environment example: `frontend/.env.example`
- Backend environment example: `backend/.env.example`
- Sitemap: `frontend/public/sitemap.xml`
- Robots: `frontend/public/robots.txt`
- Backend security headers: `backend/server.js`

## Step 1: Create Google Analytics 4

1. Open https://analytics.google.com/
2. Click `Start measuring`.
3. Create your account and property.
4. Choose a `Web` data stream.
5. Copy the Measurement ID. It looks like `G-XXXXXXXXXX`.
6. Save it in `frontend/.env`:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Step 2: Create Google Tag Manager

1. Open https://tagmanager.google.com/
2. Click `Create Account`.
3. Create a `Web` container for your domain.
4. Copy the container ID. It looks like `GTM-XXXXXXX`.
5. Save it in `frontend/.env`:

```env
VITE_GTM_ID=GTM-XXXXXXX
```

## Step 3: Connect GTM to the website

This app already loads GTM and GA4 through:

- `frontend/src/components/AnalyticsManager.jsx`
- `frontend/src/utils/analytics.js`

After adding your IDs:

1. Start the frontend.
2. Open GTM.
3. Create a new tag:
   `Google tag`
4. Paste your GA4 Measurement ID.
5. Set trigger to:
   `Initialization - All Pages`
6. Publish the container.

### React example

```jsx
import { initializeAnalytics, trackEvent, trackPageView } from "./utils/analytics";

initializeAnalytics();

trackPageView({
  path: window.location.pathname,
  title: document.title,
  location: window.location.href,
});

trackEvent("stay_booking_started", {
  booking_type: "hotel",
  source: "stay_card",
});
```

## Step 4: Verify the domain in Search Console

1. Open https://search.google.com/search-console
2. Click `Add property`
3. Choose `Domain`
4. Enter your root domain, for example:
   `mountainmate.in`
5. Copy the TXT record Google gives you
6. Open your domain DNS panel
7. Add that TXT record
8. Wait for DNS propagation
9. Return to Search Console and click `Verify`

DNS verification is the best option because it covers all protocols and subdomains.

## Step 5: Generate and submit sitemap.xml

This project already includes:

- `frontend/public/sitemap.xml`
- `frontend/public/robots.txt`

Submit this URL in Search Console:

```txt
https://mountainmate.in/sitemap.xml
```

### Example sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mountainmate.in/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://mountainmate.in/explore-stays</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

### Example robots.txt

```txt
User-agent: *
Allow: /
Disallow: /admin-mate
Disallow: /bookings
Disallow: /profile
Sitemap: https://mountainmate.in/sitemap.xml
```

## Dynamic meta tags for React SPA

This app now uses `react-helmet-async` for route-level SEO.

### React example

```jsx
import { Helmet } from "react-helmet-async";

export default function SeoBlock() {
  return (
    <Helmet>
      <title>Explore Stays | Mountain Mate</title>
      <meta
        name="description"
        content="Find verified mountain stays in Uttarakhand."
      />
      <link rel="canonical" href="https://mountainmate.in/explore-stays" />
      <meta property="og:title" content="Explore Stays | Mountain Mate" />
      <meta property="og:description" content="Find verified mountain stays in Uttarakhand." />
      <meta property="og:url" content="https://mountainmate.in/explore-stays" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
```

## Analytics events tracked

The app now pushes clean events like:

- `page_view`
- `planner_cta_clicked`
- `explore_stays_clicked`
- `explore_rides_clicked`
- `search_submitted`
- `profile_save_clicked`
- `profile_updated`
- `stay_booking_started`
- `ride_booking_started`

## Conversion tracking idea

Use these as conversions in GA4:

- `stay_booking_started`
- `ride_booking_started`
- `profile_updated`

To mark them as conversions:

1. Open GA4
2. Go to `Admin`
3. Open `Events`
4. Find the event
5. Toggle `Mark as conversion`

## Safe key storage

### Frontend

Only public IDs should go in `frontend/.env`:

```env
VITE_GTM_ID=GTM-XXXXXXX
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

### Backend

Secrets must stay in `backend/.env` or your hosting provider secret manager:

```env
SUPABASE_SERVICE_ROLE_KEY=replace_me
JWT_SECRET=replace_me
CLOUDINARY_API_SECRET=replace_me
RAZORPAY_KEY_SECRET=replace_me
MONGO_URI=replace_me
```

### Never do this

- Never commit real secrets to GitHub
- Never put secret API keys in React components
- Never expose service-role or admin keys in frontend JavaScript
- Never hardcode secrets in source files

### If a key leaks

1. Rotate it immediately in the provider dashboard
2. Replace it in your backend `.env`
3. Redeploy the backend
4. Invalidate old credentials if supported

## Backend security example

This project already applies security headers in `backend/server.js`.

### Node/Express example

```js
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  next();
});
```

### PHP secure config example

```php
<?php
return [
    'db_host' => getenv('DB_HOST'),
    'db_name' => getenv('DB_NAME'),
    'db_user' => getenv('DB_USER'),
    'db_password' => getenv('DB_PASSWORD'),
    'jwt_secret' => getenv('JWT_SECRET'),
    'gtm_id' => getenv('GTM_ID'),
    'ga_measurement_id' => getenv('GA_MEASUREMENT_ID'),
];
```

## Security checklist

- Use HTTPS only in production
- Keep frontend limited to public keys only
- Validate and sanitize all inputs on the backend
- Use parameterized database queries
- Escape or sanitize user-generated HTML
- Use a strong CSP
- Use rate limiting
- Keep dependencies updated
- Rotate secrets if they were ever exposed

## Important note for this project

If any real secrets were already stored in local `.env` files or committed previously, treat them as compromised and rotate them now.
