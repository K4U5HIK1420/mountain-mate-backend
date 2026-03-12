const { successResponse, errorResponse } = require("../utils/response");
const cloudinary = require("../config/cloudinary");
const Hotel = require("../models/Hotel");
const fs = require("fs");

// 1. Add Hotel (Synced with Frontend Keys)
exports.addHotel = async (req, res, next) => {
  try {
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "mountain_mate/hotels",
        });
        imageUrls.push(result.secure_url);
        // Local file clean up
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    // ✅ FIXED: req.body se wahi keys nikal rahe hain jo frontend bhej raha hai
    const hotel = new Hotel({
      hotelName: req.body.hotelName,      
      location: req.body.location,
      pricePerNight: req.body.pricePerNight, 
      roomsAvailable: req.body.roomsAvailable || 10,
      contactNumber: req.body.contactNumber || "9999999999",
      description: req.body.description || "",
      distance: req.body.distance || "0",
      images: imageUrls,
      isVerified: false,
      status: "pending" // Default for Admin Dashboard
    });

    await hotel.save();
    res.status(201).json(hotel);
  } catch (error) {
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    next(error);
  }
};

// 2. Admin Verification Logic
exports.verifyHotel = async (req, res, next) => {
  try {
    const { hotelId, action } = req.body; 
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel record not found" });

    if (action === "approved") {
      hotel.isVerified = true;
      hotel.status = "approved";
      await hotel.save();
      return res.json({ message: "Hotel Verified & Live! 🏔️", hotel });
    } 
    
    if (action === "rejected") {
      if (hotel.images && hotel.images.length > 0) {
        for (const url of hotel.images) {
          const publicId = url.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`mountain_mate/hotels/${publicId}`);
        }
      }
      await Hotel.findByIdAndDelete(hotelId);
      return res.json({ message: "Request Rejected and Data Deleted Permanently." });
    }
  } catch (error) {
    next(error);
  }
};

// 3. Admin View (Pending & Approved)
exports.getAllHotelsForAdmin = async (req, res, next) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 });
    successResponse(res, "All hotels fetched for admin vault", hotels);
  } catch (error) {
    next(error);
  }
};

// 4. Get Verified Hotels (For Users)
exports.getHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find({ isVerified: true }).sort({ createdAt: -1 });
    successResponse(res, "Verified hotels fetched successfully", hotels);
  } catch (error) {
    next(error);
  }
};

// 5. Search Verified Hotels
exports.searchHotels = async (req, res, next) => {
  try {
    const { location, maxPrice } = req.query;
    let query = { isVerified: true };
    if (location) query.location = { $regex: location, $options: "i" };
    if (maxPrice) query.pricePerNight = { $lte: maxPrice };

    const hotels = await Hotel.find(query).sort({ createdAt: -1 });
    res.json(hotels);
  } catch (error) {
    next(error);
  }
};

// 6. Delete Hotel Image
exports.deleteHotelImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL required" });
    }

    const publicId = imageUrl.split("/").pop().split(".")[0];

    await cloudinary.uploader.destroy(`mountain_mate/hotels/${publicId}`);

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    next(error);
  }
};