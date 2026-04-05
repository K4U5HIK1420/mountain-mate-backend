const { successResponse, errorResponse } = require("../utils/response");
const cloudinary = require("../config/cloudinary");
const Hotel = require("../models/Hotel");
const fs = require("fs");
const { getDataStore } = require("../utils/dataStore");
const supabaseHotels = require("../services/supabaseHotelsStore");

const HOTEL_DOC_FIELDS = [
  "ownerPhoto",
  "ownerAadhaarDoc",
  "ownerPanDoc",
  "propertyRegistrationDoc",
  "tradeLicenseDoc",
  "gstCertificateDoc",
  "fireSafetyDoc",
];

function uploadFileToCloudinary(file, folder) {
  return cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: "auto",
  });
}

function buildHotelComplianceDetails(body = {}) {
  return {
    ownerAadhaarNumber: body.ownerAadhaarNumber || "",
    ownerPanNumber: body.ownerPanNumber || "",
    gstNumber: body.gstNumber || "",
    registrationNumber: body.registrationNumber || "",
    tradeLicenseNumber: body.tradeLicenseNumber || "",
    fireSafetyCertificateNumber: body.fireSafetyCertificateNumber || "",
    bankAccountHolder: body.bankAccountHolder || "",
    bankAccountNumber: body.bankAccountNumber || "",
    ifscCode: body.ifscCode || "",
  };
}

// 1. Add Hotel (Synced with Owner ID)
exports.addHotel = async (req, res, next) => {
  try {
    const imageUrls = [];
    const verificationDocuments = {};
    const imageFiles = req.files?.images || [];

    if (imageFiles.length > 0) {
      for (let file of imageFiles) {
        const result = await uploadFileToCloudinary(file, "mountain_mate/hotels");
        imageUrls.push(result.secure_url);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    for (const field of HOTEL_DOC_FIELDS) {
      const file = req.files?.[field]?.[0];
      if (!file) {
        verificationDocuments[field] = "";
        continue;
      }

      const result = await uploadFileToCloudinary(file, "mountain_mate/hotel_verification");
      verificationDocuments[field] = result.secure_url;
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }

    const complianceDetails = buildHotelComplianceDetails(req.body);

    if (getDataStore() === "supabase") {
      const created = await supabaseHotels.addHotel({
        ownerId: req.user.id,
        payload: {
          ...req.body,
          images: imageUrls,
          complianceDetails,
          verificationDocuments,
        },
      });
      return res.status(201).json(created);
    }

    const hotel = new Hotel({
      hotelName: req.body.hotelName,
      propertyType: req.body.propertyType || "Hotel",
      location: req.body.location,
      landmark: req.body.landmark || "",
      ownerName: req.body.ownerName || "",
      pricePerNight: Number(req.body.pricePerNight),
      roomsAvailable: Number(req.body.roomsAvailable) || 10,
      guestsPerRoom: Number(req.body.guestsPerRoom) || 2,
      availabilityStatus: req.body.availabilityStatus || "Available now",
      contactNumber: req.body.contactNumber || "9999999999",
      description: req.body.description || "",
      distance: req.body.distance || "0",
      images: imageUrls,
      complianceDetails,
      verificationDocuments,
      owner: req.user.id,
      isVerified: false,
      status: "pending",
    });

    await hotel.save();
    return res.status(201).json(hotel);
  } catch (error) {
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    next(error);
  }
};

// 2. Get My Hotels (Sirf logged-in owner ke liye)
exports.getMyHotels = async (req, res, next) => {
  try {
    if (getDataStore() === "supabase") {
      const myHotels = await supabaseHotels.getMyHotels(req.user.id);
      return successResponse(res, "Your listed hotels fetched successfully", myHotels);
    }

    const myHotels = await Hotel.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return successResponse(res, "Your listed hotels fetched successfully", myHotels);
  } catch (error) {
    next(error);
  }
};

// 3. Update Hotel Details (Hotel Name aur Owner ID chhod kar sab update hoga)
exports.updateHotel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const imageUrls = [];
    const uploadedDocs = {};
    const imageFiles = req.files?.images || [];

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const result = await uploadFileToCloudinary(file, "mountain_mate/hotels");
        imageUrls.push(result.secure_url);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    for (const field of HOTEL_DOC_FIELDS) {
      const file = req.files?.[field]?.[0];
      if (!file) continue;
      const result = await uploadFileToCloudinary(file, "mountain_mate/hotel_verification");
      uploadedDocs[field] = result.secure_url;
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }

    if (getDataStore() === "supabase") {
      const existing = await supabaseHotels.getHotelById(id);
      if (!existing || String(existing.owner || "") !== String(req.user.id || "")) {
        return res.status(404).json({ message: "Hotel not found or unauthorized to update" });
      }

      const existingCompliance = existing.complianceDetails || {};
      const existingDocs = existing.verificationDocuments || {};
      const mergedCompliance = {
        ...existingCompliance,
        ...buildHotelComplianceDetails(req.body),
      };
      const mergedDocs = {
        ...existingDocs,
        ...uploadedDocs,
      };

      let parsedAmenities;
      if (req.body.amenities !== undefined) {
        try {
          parsedAmenities = JSON.parse(req.body.amenities);
        } catch (_err) {
          parsedAmenities = existing.amenities ? JSON.parse(existing.amenities) : [];
        }
      }

      const updated = await supabaseHotels.updateHotel({
        ownerId: req.user.id,
        id,
        updateData: {
          ...req.body,
          amenities: parsedAmenities,
          images: imageUrls.length ? [...(existing.images || []), ...imageUrls] : undefined,
          complianceDetails: mergedCompliance,
          verificationDocuments: mergedDocs,
        },
      });
      return res.json({
        success: true,
        message: "Property details updated successfully! 🏔️",
        data: updated,
      });
    }
    
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

    if (Object.keys(uploadedDocs).length) {
      updateData.verificationDocuments = {
        ...(hotel.verificationDocuments || {}),
        ...uploadedDocs,
      };
    }
    if (imageUrls.length) {
      updateData.images = [...(hotel.images || []), ...imageUrls];
    }
    updateData.complianceDetails = {
      ...(hotel.complianceDetails || {}),
      ...buildHotelComplianceDetails(req.body),
    };
    if (req.body.amenities !== undefined) {
      try {
        updateData.amenities = JSON.parse(req.body.amenities);
      } catch (_err) {
      }
    }

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
    if (req.files) {
      Object.values(req.files).flat().forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
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
    if (getDataStore() === "supabase") {
      const hotels = await supabaseHotels.listAllHotels();
      return successResponse(res, "All hotels fetched for admin vault", hotels);
    }
    const hotels = await Hotel.find().sort({ createdAt: -1 });
    successResponse(res, "All hotels fetched for admin vault", hotels);
  } catch (error) {
    next(error);
  }
};

// 6. Get Verified Hotels (Public Users)
exports.getHotels = async (req, res, next) => {
  try {
    if (getDataStore() === "supabase") {
      const hotels = await supabaseHotels.listApprovedHotels();
      return successResponse(res, "Verified hotels fetched successfully", hotels);
    }
    const hotels = await Hotel.find({ isVerified: true }).sort({ createdAt: -1 });
    successResponse(res, "Verified hotels fetched successfully", hotels);
  } catch (error) {
    next(error);
  }
};

// 7. Search Verified Hotels
exports.searchHotels = async (req, res, next) => {
  try {
    if (getDataStore() === "supabase") {
      const hotels = await supabaseHotels.searchApprovedHotels({
        location: req.query.location || "",
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        sort: req.query.sort,
      });
      return res.json(hotels);
    }

    const { location, maxPrice, minPrice, sort } = req.query;
    let query = { isVerified: true };
    if (location) query.location = { $regex: location, $options: "i" };
    const priceQuery = {};
    if (minPrice) priceQuery.$gte = Number(minPrice);
    if (maxPrice) priceQuery.$lte = Number(maxPrice);
    if (Object.keys(priceQuery).length) query.pricePerNight = priceQuery;

    const sortMap = {
      price_asc: { pricePerNight: 1 },
      price_desc: { pricePerNight: -1 },
      newest: { createdAt: -1 },
    };
    const hotels = await Hotel.find(query).sort(sortMap[sort] || { createdAt: -1 });
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
