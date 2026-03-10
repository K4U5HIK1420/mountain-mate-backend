const { successResponse, errorResponse } = require("../utils/response");
const cloudinary = require("../config/cloudinary");
const Hotel = require("../models/Hotel");
const fs = require("fs");

// 1. Add Hotel (Same as before - Multiple Images + Cleanup)
exports.addHotel = async (req, res, next) => {
  try {
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "mountain_mate/hotels",
        });
        imageUrls.push(result.secure_url);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const hotel = new Hotel({
      hotelName: req.body.name,
      location: req.body.location,
      pricePerNight: req.body.price,
      roomsAvailable: req.body.rooms || 10,
      contactNumber: req.body.contact || "9999999999",
      description: req.body.description || "",
      images: imageUrls,
      isVerified: false,
      status: "pending"
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

// 2. Get All VERIFIED Hotels (Sorted: Newest First)
exports.getHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find({ isVerified: true }).sort({ createdAt: -1 });
    successResponse(res, "Verified hotels fetched successfully", hotels);
  } catch (error) {
    next(error);
  }
};

// 3. Search VERIFIED Hotels
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

// 4. UPGRADED: Admin Verification (Approve OR Delete on Reject)
exports.verifyHotel = async (req, res, next) => {
  try {
    const { hotelId, action } = req.body; 

    // Find hotel first to get image details
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel record not found" });

    if (action === "approved") {
      // Approve logic
      hotel.isVerified = true;
      hotel.status = "approved";
      await hotel.save();
      return res.json({ message: "Hotel Verified & Live! 🏔️", hotel });
    } 
    
    if (action === "rejected") {
      // 🚨 REJECT & DELETE LOGIC
      // 1. Cloudinary se images delete karo
      if (hotel.images && hotel.images.length > 0) {
        for (const url of hotel.images) {
          const publicId = url.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`mountain_mate/hotels/${publicId}`);
        }
      }
      // 2. Database se pura document delete karo
      await Hotel.findByIdAndDelete(hotelId);
      return res.json({ message: "Request Rejected and Data Deleted Permanently." });
    }

  } catch (error) {
    next(error);
  }
};

// 5. GET ALL HOTELS (Admin Dashboard - Shows Pending & Approved)
exports.getAllHotelsForAdmin = async (req, res, next) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 });
    successResponse(res, "All hotels fetched for admin vault", hotels);
  } catch (error) {
    next(error);
  }
};

// 6. Delete Single Image
exports.deleteHotelImage = async (req, res, next) => {
  try {
    const { hotelId, imageUrl } = req.body;
    const publicId = imageUrl.split("/").pop().split(".")[0];

    await cloudinary.uploader.destroy(`mountain_mate/hotels/${publicId}`);

    const hotel = await Hotel.findByIdAndUpdate(
      hotelId,
      { $pull: { images: imageUrl } },
      { new: true }
    );

    res.json({ message: "Image removed successfully", hotel });
  } catch (error) {
    next(error);
  }
};