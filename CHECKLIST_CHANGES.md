# Mountain Mate Change Checklist

## Frontend UX and Content

- [x] Remove `Mountain Mate` and `Uttarakhand` text beside the logo in the navbar
- [x] Remove navbar logout button and keep logout only on profile page
- [x] Add profile picture upload/edit support inside the profile page with other editable profile fields
- [x] Keep the bottom navbar visible only on mobile devices
- [x] Show admin console item in the bottom navbar only for admins
- [x] Remove phone number flow from login and register pages
- [x] Rename `Security Key` to `Password`
- [x] Remove hard-coded/example placeholders from login/register forms
- [x] Fix notification drawer overflow on smaller screens
- [x] Change `BOOK STAYS PREMEMIUM` to the correct copy
- [x] Remove unnecessary filters from explore stays
- [x] Fix `TRACKED` overflow on mobile in explore rides
- [x] Fix stay/ride detail modals on mobile so content fits correctly
- [x] Improve manage stays mobile layout and rename `Modify Asset Specs`
- [x] Redesign admin support queue chat to match the user support chat quality
- [x] Prepare the homepage cards so the user can add Kedarnath Access, Rishikesh to Chopta, and Valley of Flowers images
- [x] Optimize the heavy homepage background image / visual performance
- [x] Replace the maintenance page with a plain background, clean font, and short type animation without extra content

## Validation and Forms

- [x] Add stronger frontend validation for common fields like Aadhaar, PAN, IFSC, phone, and email
- [x] Review forms across add stay, offer ride, manage stay, manage ride, and auth flows for invalid input handling

## Maps and Functional Bugs

- [x] Fix map issues in route preview page
- [x] Fix map issues in offer rides
- [x] Fix map issues in explore rides

## Security Hardening

- [x] Review backend for exposed or hard-coded keys
- [x] Move sensitive keys/config to environment variables where needed
- [x] Add public endpoint rate limiting with graceful 429 responses
- [x] Add stricter backend validation and sanitization with schema-based checks and unexpected-field rejection
- [x] Follow OWASP-style safe defaults without breaking current app behavior

## Verification

- [x] Build frontend successfully after UI changes
- [x] Run backend verification for security middleware changes
- [x] Update this checklist with completed items and note any remaining follow-ups

## Follow-up Notes

- [x] Frontend build passes after the second validation and map stability pass
- [x] Shared validation helpers now normalize email, phone, PAN, IFSC, Aadhaar, bank account, and vehicle plate inputs
- [x] Shared location helpers now back route previews and live-location flows with safer geocoding and reverse-geocoding fallbacks
- [x] Route preview no longer depends on Leaflet's default marker image assets, reducing mobile/prod marker issues
- [x] Final live-device sanity check is still recommended after deployment for route tile availability and geolocation permission prompts
