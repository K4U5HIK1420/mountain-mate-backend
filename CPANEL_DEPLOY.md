# cPanel Deployment Guide

This project can be deployed in one cPanel account as:

- `frontend/` on your main domain as a static site
- `backend/` on a subdomain such as `api.yourdomain.com` with cPanel's Node.js Application Manager / Passenger

## 1. Prepare frontend environment

In `frontend/.env.production`, set:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_OPENWEATHER_API_KEY=your_openweather_key
VITE_RAZORPAY_KEY_ID=your_razorpay_public_key
```

## 2. Build frontend

```powershell
cd frontend
npm install
npm run build
```

The output will be in `frontend/dist`.

## 3. Upload frontend to cPanel

1. Open cPanel
2. Open `File Manager`
3. Go to `public_html`
4. Delete placeholder files if needed
5. Upload everything inside `frontend/dist/` to `public_html/`

Important:

- keep the generated `.htaccess` file from the build output
- this project uses React Router, so `.htaccess` is required for route refreshes

## 4. Create the API subdomain in cPanel

1. Open `Domains` or `Subdomains`
2. Create `api.yourdomain.com`
3. Point it to a folder such as `api`

## 5. Upload backend source

Upload the `backend/` folder into your cPanel account, for example:

- `/home/youruser/mountain-mates/backend`

Then extract it there.

## 6. Create the Node.js app in cPanel

This requires cPanel's `Application Manager` / `Setup Node.js App` feature to be enabled by your hosting provider.

Recommended values:

- Node.js version: `18` or `20`
- Application root: `mountain-mates/backend`
- Application URL: `api.yourdomain.com`
- Application startup file: `app.js`

After creating the app, open the terminal for that app or cPanel terminal and run:

```bash
cd ~/mountain-mates/backend
npm install --omit=dev
```

## 7. Add backend environment variables

In the cPanel Node.js app environment screen, add:

```env
DATA_STORE=supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GEMINI_API_KEY=your_gemini_key
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Then restart the Node.js app from cPanel.

## 8. Point domain to cPanel

In your domain DNS:

- point the main domain or subdomain to your cPanel hosting account

## 9. Verify after upload

Check:

- `/`
- `/register`
- `/login`
- `/bookings`
- `/admin-mate`
- `https://api.yourdomain.com/api/health`

If direct route refreshes fail, `.htaccess` is missing or Apache rewrite is disabled.

## Notes

- The backend setup only works if your cPanel package includes Node.js application support.
- This project uses Socket.IO. Many cPanel Node.js setups work with Passenger, but some hosts place limits on WebSockets or long-lived connections. Test notifications, admin alerts, and ride live-tracking after deployment.
