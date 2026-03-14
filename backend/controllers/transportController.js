const Transport = require("../models/Transport");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// 1. Add Transport (Synced with Owner ID)
exports.addTransport = async (req, res, next) => {
  try {
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "mountain_mate/rides",
        });
        imageUrls.push(result.secure_url);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const transport = new Transport({
      vehicleType: req.body.vehicleName, // Frontend model key
      routeFrom: req.body.location,     // Frontend location key
      routeTo: req.body.routeTo || "Unknown",
      pricePerSeat: req.body.pricePerDay || req.body.price,
      seatsAvailable: req.body.capacity,
      driverName: req.body.driverName || "Partner Driver",
      contactNumber: req.body.contactNumber,
      images: imageUrls,
      owner: req.user.id, // Auth middleware se ID
      isVerified: false,
      status: "pending"
    });

    await transport.save();

    res.json({
      success: true,
      message: "Vehicle Registered! Admin approval ka wait karo 🚕",
      transport
    });
  } catch (error) {
    console.error("Transport Error:", error);
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// 2. Get My Rides (Sirf logged-in owner ke liye)
exports.getMyRides = async (req, res, next) => {
  try {
    const myRides = await Transport.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: myRides });
  } catch (error) {
    console.error("Fetch my rides error:", error);
    res.status(500).json({ message: "Failed to fetch your rides" });
  }
};

// 3. Update Ride Details (Owner can update everything except restricted fields)
exports.updateTransport = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check property owner (Security check)
    const ride = await Transport.findOne({ _id: id, owner: req.user.id });

    if (!ride) {
      return res.status(404).json({ message: "Ride not found or unauthorized to update" });
    }

    const updateData = { ...req.body };

    // Mapping frontend keys to model keys if necessary
    if (updateData.vehicleName) updateData.vehicleType = updateData.vehicleName;
    if (updateData.location) updateData.routeFrom = updateData.location;
    if (updateData.pricePerDay) updateData.pricePerSeat = updateData.pricePerDay;
    if (updateData.capacity) updateData.seatsAvailable = updateData.capacity;

    // ✅ RESTRICTION: Ye fields locked rahengi
    const restrictedFields = ["owner", "vehicleNumber", "isVerified", "status", "_id"];
    restrictedFields.forEach(field => delete updateData[field]);

    const updatedRide = await Transport.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      message: "Ride specifications updated! 🚕", 
      data: updatedRide 
    });
  } catch (error) {
    console.error("Update Ride Error:", error);
    res.status(500).json({ message: "Failed to sync ride updates" });
  }
};

// 4. Public View (Sirf approved wali rides)
exports.getTransports = async (req, res) => {
  try {
    const rides = await Transport.find({
      status: "approved",
      isVerified: true
    }).sort({ createdAt: -1 });

    res.json(rides);
  } catch (error) {
    console.error("Fetch rides error:", error);
    res.status(500).json({ message: "Failed to fetch rides" });
  }
};

// 5. Search Transport by Route
exports.searchTransport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const query = { status: "approved", isVerified: true };
    
    if (from) query.routeFrom = { $regex: from, $options: "i" };
    if (to) query.routeTo = { $regex: to, $options: "i" };

    const transports = await Transport.find(query);
    res.json(transports);
  } catch (error) {
    next(error);
  }
};

// 6. Admin View (All Data)
exports.getAllRidesForAdmin = async (req, res) => {
  try {
    const rides = await Transport.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ message: "Failed to fetch rides" });
  }
};

// 7. Admin Verification Logic
exports.verifyTransport = async (req, res) => {
  try {
    const { rideId, action } = req.body;
    const ride = await Transport.findById(rideId);

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (action === "approved") {
      ride.isVerified = true;
      ride.status = "approved";
      await ride.save();
      
      const io = req.app.get("io");
      if (io) {
        io.emit("seatsUpdated", {
          rideId: ride._id,
          seatsAvailable: ride.seatsAvailable
        });
      }

      return res.json({ message: "Ride approved and live!", ride });
    }

    if (action === "rejected") {
      await Transport.findByIdAndDelete(rideId);
      return res.json({ message: "Ride rejected and data purged." });
    }
  } catch (error) {
    console.error("Ride verification error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// 8. Booking Logic (Decrease Seats)
exports.bookRide = async (req, res) => {
  try {
    const { rideId, seats } = req.body;
    const ride = await Transport.findById(rideId);

    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.seatsAvailable < seats) return res.status(400).json({ message: "Not enough seats available" });

    const updatedRide = await Transport.findByIdAndUpdate(
      rideId,
      { $inc: { seatsAvailable: -seats } },
      { new: true }
    );

    res.json({
      success: true,
      message: "Seats booked successfully",
      ride: updatedRide
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Booking failed" });
  }
};