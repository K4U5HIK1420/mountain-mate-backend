const { successResponse, errorResponse } = require("../utils/response");
const cloudinary = require("../config/cloudinary");
const Hotel = require("../models/Hotel");

// Add Hotel
exports.addHotel = async (req, res, next) => {
  try {
    const imageUrls = [];

    for (let file of req.files) {
      const result = await cloudinary.uploader.upload(file.path);
      imageUrls.push(result.secure_url);
    }

    const hotel = new Hotel({
      ...req.body,
      images: imageUrls,
    });

    await hotel.save();

    res.status(201).json(hotel);
  } catch (error) {
    next(error);
    }
};


// Get All Hotels
exports.getHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find();
    successResponse(res, "Hotels fetched successfully", hotels);
  } catch (error) {
    next(error);
  }
};

// Search Hotels with Filters
exports.searchHotels = async (req, res, next) => {
    try {
        const { location, maxPrice } = req.query;

        let query = {};

        if (location) {
            query.location = { $regex: location, $options: "i" };
        }

        if (maxPrice) {
            query.pricePerNight = { $lte: maxPrice };
        }

        const hotels = await Hotel.find(query);

        res.json(hotels);
    } catch (error) {
        next(error);
    }
};

exports.deleteHotelImage = async (req, res, next) => {
  try {
    const { hotelId, imageUrl } = req.body;

    // Extract public_id from URL
    const parts = imageUrl.split("/");
    const filename = parts[parts.length - 1];
    const publicId = filename.split(".")[0];

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove image from DB
    const hotel = await Hotel.findByIdAndUpdate(
      hotelId,
      { $pull: { images: imageUrl } },
      { new: true }
    );

    res.json({
      message: "Image deleted successfully",
      hotel,
    });

  } catch (error) {
    next(error);
  }
};
