const Transport = require("../models/Transport");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

// 1. Add Transport (Owner Linking Fixed)
exports.addTransport = async (req, res, next) => {
  try {
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
      }
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
      status: "pending"
    });

    await transport.save();
    await User.findByIdAndUpdate(req.user.id, { hasRides: true });

    res.json({
      success: true,
      message: "Fleet Transmission Successful! 🚕 Admin approval pending.",
      transport
    });
  } catch (error) {
    console.error("Transport Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// 2. Get My Rides (Owner Dashboard)
exports.getMyRides = async (req, res) => {
  try {
    const myRides = await Transport.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: myRides });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your rides" });
  }
};

// 3. ✅ UPDATE TRANSPORT (Missing Function Fixed)
exports.updateTransport = async (req, res) => {
    try {
      const { id } = req.params;
      const updatedRide = await Transport.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
      );
  
      if (!updatedRide) return res.status(404).json({ message: "Ride not found" });
  
      res.json({
        success: true,
        message: "Fleet Data Updated! 🚀",
        data: updatedRide
      });
    } catch (error) {
      res.status(500).json({ message: "Update failed" });
    }
};

// 4. ✅ BOOK RIDE (Missing Function Fixed)
exports.bookRide = async (req, res) => {
    try {
      const { rideId, seats } = req.body;
      const ride = await Transport.findById(rideId);
      
      if (!ride) return res.status(404).json({ message: "Ride not found" });
      
      if (ride.seatsAvailable < seats) {
        return res.status(400).json({ message: "Not enough seats available!" });
      }
  
      ride.seatsAvailable -= seats;
      await ride.save();
  
      res.json({
        success: true,
        message: "Seats reserved successfully! 🚕",
        ride
      });
    } catch (error) {
      res.status(500).json({ message: "Booking failed" });
    }
};

// 5. Get All Approved Transports
exports.getTransports = async (req, res) => {
  try {
    const rides = await Transport.find({
      status: "approved",
      isVerified: true
    }).sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rides" });
  }
};

// 6. Search Transport by Route
exports.searchTransport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const transports = await Transport.find({
      routeFrom: { $regex: from, $options: "i" },
      routeTo: { $regex: to, $options: "i" },
      status: "approved"
    });
    res.json(transports);
  } catch (error) {
    next(error);
  }
};

// 7. Admin Verification
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
      if(io) io.emit("seatsUpdated", { rideId: ride._id, seatsAvailable: ride.seatsAvailable });

      return res.json({ message: "Ride approved and live!", ride });
    }

    if (action === "rejected") {
      await Transport.findByIdAndDelete(rideId);
      return res.json({ message: "Ride rejected and removed from system" });
    }
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
};

// 8. Admin All Rides
exports.getAllRidesForAdmin = async (req, res) => {
  try {
    const rides = await Transport.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin data" });
  }
};