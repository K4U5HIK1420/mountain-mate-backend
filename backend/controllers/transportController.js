const Transport = require("../models/Transport");
const cloudinary = require("cloudinary").v2;

// Add Transport
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
        vehicleType: req.body.vehicleName,
        routeFrom: req.body.location,
        routeTo: "Unknown", // temporary until you add destination field
        pricePerSeat: req.body.pricePerDay,
        seatsAvailable: req.body.capacity,
        driverName: "Driver", // temporary
        contactNumber: req.body.contactNumber,
        images: imageUrls,
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
    res.status(400).json({ message: error.message });
  }
};

// Get All Transports
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

// Search Transport by Route
exports.searchTransport = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        const transports = await Transport.find({
            routeFrom: { $regex: from, $options: "i" },
            routeTo: { $regex: to, $options: "i" }
        });

        res.json(transports);
    } catch (error) {
        next(error);
    }
};

exports.getAllRidesForAdmin = async (req, res) => {
  try {
    const rides = await Transport.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ message: "Failed to fetch rides" });
  }
};

exports.verifyTransport = async (req, res) => {
  try {
    const { rideId, action } = req.body;

    console.log("VERIFY RIDE:", req.body);

    const ride = await Transport.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (action === "approved") {
      ride.isVerified = true;
      ride.status = "approved";
      await ride.save();
      const io = req.app.get("io");
          io.emit("seatsUpdated", {
          rideId: ride._id,
          seatsAvailable: ride.seatsAvailable
        });

      return res.json({ message: "Ride approved", ride });
    }

    if (action === "rejected") {
      await Transport.findByIdAndDelete(rideId);
      return res.json({ message: "Ride rejected and deleted" });
    }

  } catch (error) {
    console.error("Ride verification error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

exports.bookRide = async (req, res) => {
  try {

    const { rideId, seats } = req.body;

    const ride = await Transport.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.seatsAvailable < seats) {
      return res.status(400).json({ message: "Not enough seats available" });
    }

    // decrease seats
    await Transport.findByIdAndUpdate(
      rideId,
      { $inc: { seatsAvailable: -seats } },
      { new: true }
    );

    res.json({
      success: true,
      message: "Seats booked successfully",
      ride
    });

  } catch (error) {

    console.error("Booking error:", error);

    res.status(500).json({ message: "Booking failed" });

  }
};