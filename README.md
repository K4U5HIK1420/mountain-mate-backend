# 🏔️ MOUNTAIN-MATE Backend

Backend API for a mountain travel booking platform (Char Dham / Uttarakhand routes).

## 🚀 Features

- Transport Listings API
- Hotel Listings API
- Booking System
- Booking Status Management
- Search & Filter APIs
- MongoDB Atlas Cloud Database

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose

---

## ⚙️ Setup Instructions

### 1. Clone Repository

git clone <repo-url>

cd mountain-mate-backend

---

### 2. Install Dependencies

npm install

---

### 3. Create `.env` File

Add:

PORT=5000
MONGO_URI=your_mongodb_connection_string

---

### 4. Run Server

npx nodemon server.js

---

## 📡 API Base URL

http://localhost:5000/api

---

## 👨‍💻 Contributors

- Anant Kaushik
- Shardul Aswal

---

# 📡 API Documentation

Base URL:
http://localhost:5000/api

---

## 🔐 Authentication APIs

### 1️⃣ Register Admin (One Time Only)

POST /auth/register

Body:
{
  "email": "admin@mountainmate.com",
  "password": "123456"
}

---

### 2️⃣ Login Admin

POST /auth/login

Body:
{
  "email": "admin@mountainmate.com",
  "password": "123456"
}

Response:
{
  "token": "JWT_TOKEN"
}

⚠️ Save this token — required for protected routes.

---

## 🚐 Transport APIs

### Add Transport (Protected)

POST /transport/add

Headers:
Authorization: JWT_TOKEN

Body:
{
  "vehicleType": "Bolero",
  "routeFrom": "Sonprayag",
  "routeTo": "Gaurikund",
  "pricePerSeat": 500,
  "seatsAvailable": 6,
  "driverName": "Ramesh",
  "contactNumber": "9876543210"
}

---

### Get All Transport

GET /transport/all

---

### Search Transport

GET /transport/search?from=Sonprayag&to=Gaurikund

---

## 🏨 Hotel APIs

### Add Hotel (Protected)

POST /hotel/add

Headers:
Authorization: JWT_TOKEN

Body:
{
  "hotelName": "Shiv Lodge",
  "location": "Sonprayag",
  "pricePerNight": 1200,
  "roomsAvailable": 5,
  "contactNumber": "9876543210",
  "description": "Budget stay near Kedarnath route"
}

---

### Get All Hotels

GET /hotel/all

---

### Search Hotels

GET /hotel/search?location=Sonprayag&maxPrice=1500

---

## 📅 Booking APIs

### Create Booking

POST /booking/create

Body:
{
  "customerName": "Anant",
  "phoneNumber": "9876543210",
  "bookingType": "Hotel",
  "listingId": "HOTEL_OR_TRANSPORT_ID",
  "date": "2026-05-10"
}

---

### Get All Bookings

GET /booking/all

---

### Update Booking Status (Protected)

PUT /booking/update/:id

Headers:
Authorization: JWT_TOKEN

Body:
{
  "status": "confirmed"
}

---
