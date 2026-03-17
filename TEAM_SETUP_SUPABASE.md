## Mountain Mates — Team Setup (Supabase + local dev)

This repo is **full-stack**:
- `frontend/` = Vite + React
- `backend/` = Node/Express (still supports Mongo, with an optional Supabase Postgres switch)

### 1) Prereqs
- Node.js installed
- Access to the Supabase project (or create your own)

### 2) Supabase: apply database schema (required for Supabase DB mode)
In Supabase Dashboard → **SQL Editor**, run:
- `supabase/schema.sql`

This creates tables:
- `hotels`, `transports`, `bookings`, `reviews`, `profiles`

### 3) Frontend environment (`frontend/.env`)
Create `frontend/.env` (copy `frontend/.env.example`) and set:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_or_publishable_key>

VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Where to find these:
- Supabase Dashboard → Project → **Settings**
  - **Data API**: Project URL
  - **API Keys**: anon/publishable key

### 4) Backend environment (`backend/.env`)
Create `backend/.env` (copy `backend/.env.example`) and set at minimum:

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server_secret_key>
SUPABASE_JWT_ISSUER=https://<your-project-ref>.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated

# Choose data store:
# mongo = existing Mongoose models
# supabase = Supabase Postgres for partner add/list/update (incremental)
DATA_STORE=mongo

# If using mongo mode you also need:
MONGO_URI=<mongodb_uri>
JWT_SECRET=<legacy_jwt_secret>

# Cloudinary / Razorpay (if you use those features)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only**. Never put it in frontend.

### 5) Install & run locally

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

### 6) Admin role (Supabase Auth)
Admin endpoints require `app_metadata.role = "admin"`.

1) Create/sign-in the user (via the app)
2) Supabase Dashboard → **Authentication → Users** → copy the user `id`
3) Run:

```bash
cd backend
node scripts/setAdminRole.js <USER_ID> admin
```

### 7) Optional: migrate Mongo data into Supabase
After you applied `supabase/schema.sql`, you can migrate existing Mongo collections:

```bash
cd backend
node scripts/migrateMongoToSupabase.js
```

If you re-run migration and see duplicates, transports are upserted by `plate_number`.

