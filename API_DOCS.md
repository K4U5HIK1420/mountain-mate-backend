Mountain-Mate API Documentation
Base URL
https://mountain-mate-api.onrender.com

Health Check
GET /api/health

Check if API is running.

Response:

{
  "success": true,
  "message": "Mountain-Mate API is running 🚀"
}

Authentication APIs
Register User

POST /api/auth/register

Body:

{
  "name": "Anant",
  "email": "anant@gmail.com",
  "password": "123456"
}

Login User

POST /api/auth/login

Body:

{
  "email": "anant@gmail.com",
  "password": "123456"
}


Response:

{
  "success": true,
  "token": "JWT_TOKEN"
}

Hotel APIs
Add Hotel (Protected)

POST /api/hotel/add

Headers:

Authorization: Bearer TOKEN


Body (form-data):

hotelName
location
pricePerNight
roomsAvailable
contactNumber
description
images[]

Get All Hotels

GET /api/hotel/all

Transport APIs
Add Transport

POST /api/transport/add

Search Transport

GET /api/transport/search?from=Dehradun&to=Kedarnath

Booking APIs
Create Booking

POST /api/booking/create

Get All Bookings

GET /api/booking/all

Update Booking Status

PUT /api/booking/update/:id