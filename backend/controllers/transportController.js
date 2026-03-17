const Transport = require("../models/Transport");
const cloudinary = require("cloudinary").v2;
const { getDataStore } = require("../utils/dataStore");
const supabaseTransports = require("../services/supabaseTransportsStore");

// 1. Add Transport
exports.addTransport = async (req, res, next) => {
  try {
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
      }
    }

    if (getDataStore() === "supabase") {
      const created = await supabaseTransports.addTransport({
        ownerId: req.user.id,
        payload: { ...req.body, images: imageUrls },
      });
      return res.json({
        success: true,
        message: "Fleet Transmission Successful! 🚕",
        transport: created,
      });
    }

    const transport = new Transport({
      owner: req.user.id,
      vehicleModel: req.body.vehicleModel,
      vehicleType: req.body.vehicleType,
      plateNumber: req.body.plateNumber,

      routeFrom: req.body.routeFrom,
      routeTo: req.body.routeTo,

      fromCoords: JSON.parse(req.body.fromCoords),
      toCoords: JSON.parse(req.body.toCoords),

      pricePerSeat: req.body.pricePerSeat,
      seatsAvailable: req.body.seatsAvailable,
      driverName: req.body.driverName || req.user.name,
      contactNumber: req.body.contactNumber,
      images: imageUrls,
      status: "pending",
      isVerified: false // Default false
    });

    await transport.save();
    // Legacy Mongo user update (pre-Supabase). Supabase user IDs won't exist in Mongo `User` collection.
    // This should not block transport creation.

    res.json({ success: true, message: "Fleet Transmission Successful! 🚕", transport });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 2. Get My Rides
exports.getMyRides = async (req, res) => {
  try {
    if (getDataStore() === "supabase") {
      const myRides = await supabaseTransports.getMyRides(req.user.id);
      return res.json({ success: true, data: myRides });
    }
    const myRides = await Transport.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: myRides });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your rides" });
  }
};

// 3. Update Transport
exports.updateTransport = async (req, res) => {
    try {
      if (getDataStore() === "supabase") {
        const updated = await supabaseTransports.updateTransport({
          ownerId: req.user.id,
          id: req.params.id,
          updateFields: req.body,
        });
        return res.json({ success: true, message: "Fleet Data Updated! 🚀", data: updated });
      }
      const updatedRide = await Transport.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.json({ success: true, message: "Fleet Data Updated! 🚀", data: updatedRide });
    } catch (error) {
      res.status(500).json({ message: "Update failed" });
    }
};

// 4. Book Ride
exports.bookRide = async (req, res) => {
    try {
      const { rideId, seats } = req.body;
      const ride = await Transport.findById(rideId);
      if (!ride || ride.seatsAvailable < seats) return res.status(400).json({ message: "No seats!" });
      
      ride.seatsAvailable -= seats;
      await ride.save();
      res.json({ success: true, message: "Seats reserved! 🚕", ride });
    } catch (error) {
      res.status(500).json({ message: "Booking failed" });
    }
};

// 5. Get Approved Transports (Explore Page Fix)
exports.getTransports = async (req, res) => {
  try {
    // ✅ STRICT CHECK: Approved aur Verified dono hona chahiye
    const rides = await Transport.find({
      status: "approved",
      isVerified: true,
      seatsAvailable: { $gt: 0 } // Sirf wo jisme seats bachi ho
    }).sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rides" });
  }
};

// 6. Search Transport (Filter Fix)
exports.searchTransport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const transports = await Transport.find({
      routeFrom: { $regex: from, $options: "i" },
      routeTo: { $regex: to, $options: "i" },
      status: "approved",
      isVerified: true // ✅ Search mein bhi verified check
    });
    res.json(transports);
  } catch (error) {
    next(error);
  }
};

// 7. Admin Verification (Sync Fix)
exports.verifyTransport = async (req, res) => {
  try {
    const { rideId, action } = req.body;
    const ride = await Transport.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (action === "approved") {
      ride.isVerified = true; // ✅ Mark verified
      ride.status = "approved"; // ✅ Mark approved
      await ride.save();
      
      // Socket emission if needed
      const io = req.app.get("io");
      if(io) io.emit("fleetUpdate", { rideId: ride._id, status: "live" });

      return res.json({ success: true, message: "Ride approved and live!", ride });
    }

    if (action === "rejected") {
      await Transport.findByIdAndDelete(rideId);
      return res.json({ success: true, message: "Ride rejected and removed" });
    }
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
};

// 8. Admin All Rides
exports.getAllRidesForAdmin = async (req, res) => {
  try {
    const rides = await Transport.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin data" });
  }
};