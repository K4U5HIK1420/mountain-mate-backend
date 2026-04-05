# Mountain Mate

Mountain Mate is a mountain travel platform for Uttarakhand that brings verified stays, reliable rides, trip planning, and support into one system.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Data: MongoDB and/or Supabase
- Payments: Razorpay

## Local setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env` from `frontend/.env.example`.

Important frontend values:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Create `backend/.env` from `backend/.env.example`.

Minimum backend values:

```env
PORT=5000
JWT_SECRET=
DATA_STORE=mongo
MONGO_URI=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## Razorpay status

The project already supports:

- creating Razorpay orders from bookings
- opening Razorpay Checkout on the frontend
- verifying the Razorpay signature after payment
- marking bookings paid or failed
- reserving hotel rooms or ride seats after successful payment
- webhook handling for `payment.captured`, `order.paid`, and `payment.failed`

Backend endpoints:

- `GET /api/payment/key`
- `POST /api/payment/create-order`
- `POST /api/payment/verify`
- `POST /api/payment/webhook`

Frontend payment flow:

- booking confirmation page loads booking details
- frontend requests payment key and order from backend
- Razorpay Checkout opens
- success callback posts verification payload to backend
- payment result page shows success or failure

## Razorpay deployment checklist

Before going live, make sure all of this is done:

1. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `backend/.env`.
2. Add `RAZORPAY_WEBHOOK_SECRET` to `backend/.env`.
3. In the Razorpay dashboard, create a webhook pointing to `https://your-domain.com/api/payment/webhook`.
4. Use the exact same webhook secret in Razorpay and in `backend/.env`.
5. Restart the backend after changing env values.
6. Complete one real payment test from the booking confirmation page.
7. Confirm the booking record stores `orderId`, `paymentId`, and `paymentStatus`.
8. Confirm inventory reduces correctly for hotel rooms and transport seats.

## What is still left

Code-side Razorpay setup is now largely complete. The main remaining work is operational:

- add real production env values
- configure the Razorpay webhook in the dashboard
- test one full live payment
- optionally add refunds or cancellations later if your product needs them

## Base URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
