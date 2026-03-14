const { successResponse, errorResponse } = require("../utils/response");
const cloudinary = require("../config/cloudinary");
const Hotel = require("../models/Hotel");
const fs = require("fs");

// 1. Add Hotel (Synced with Owner ID)
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
      hotelName: req.body.hotelName,      
      location: req.body.location,
      pricePerNight: Number(req.body.pricePerNight), 
      roomsAvailable: Number(req.body.roomsAvailable) || 10,
      contactNumber: req.body.contactNumber || "9999999999",
      description: req.body.description || "",
      distance: req.body.distance || "0",
      images: imageUrls,
      owner: req.user.id, // Auth middleware se logged-in user ki ID
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

// 2. Get My Hotels (Sirf logged-in owner ke liye)
exports.getMyHotels = async (req, res, next) => {
  try {
    const myHotels = await Hotel.find({ owner: req.user.id }).sort({ createdAt: -1 });
    successResponse(res, "Your listed hotels fetched successfully", myHotels);
  } catch (error) {
    next(error);
  }
};

// 3. Update Hotel Details (Hotel Name aur Owner ID chhod kar sab update hoga)
exports.updateHotel = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check property owner (Security check)
    const hotel = await Hotel.findOne({ _id: id, owner: req.user.id });

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found or unauthorized to update" });
    }

    // Saara data req.body se uthate hain
    const updateData = { ...req.body };

    // ✅ RESTRICTION: Ye fields kabhi update nahi honi chahiye
    const restrictedFields = ["hotelName", "owner", "isVerified", "status", "_id"];
    restrictedFields.forEach(field => delete updateData[field]);

    // Data types handle karne ke liye (Price aur Rooms numbers hone chahiye)
    if (updateData.pricePerNight) updateData.pricePerNight = Number(updateData.pricePerNight);
    if (updateData.roomsAvailable) updateData.roomsAvailable = Number(updateData.roomsAvailable);

    const updatedHotel = await Hotel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      message: "Property details updated successfully! 🏔️", 
      data: updatedHotel 
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Failed to update property details. Database sync error." });
  }
};

// 4. Admin Verification Logic
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

// 5. Admin View (All Data)
exports.getAllHotelsForAdmin = async (req, res, next) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 });
    successResponse(res, "All hotels fetched for admin vault", hotels);
  } catch (error) {
    next(error);
  }
};

// 6. Get Verified Hotels (Public Users)
exports.getHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find({ isVerified: true }).sort({ createdAt: -1 });
    successResponse(res, "Verified hotels fetched successfully", hotels);
  } catch (error) {
    next(error);
  }
};

// 7. Search Verified Hotels
exports.searchHotels = async (req, res, next) => {
  try {
    const { location, maxPrice } = req.query;
    let query = { isVerified: true };
    if (location) query.location = { $regex: location, $options: "i" };
    if (maxPrice) query.pricePerNight = { $lte: Number(maxPrice) };

    const hotels = await Hotel.find(query).sort({ createdAt: -1 });
    res.json(hotels);
  } catch (error) {
    next(error);
  }
};

// 8. Delete Hotel Image
exports.deleteHotelImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ message: "Image URL required" });
    const publicId = imageUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`mountain_mate/hotels/${publicId}`);
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    next(error);
  }
};