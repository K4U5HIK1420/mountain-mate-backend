const Transport = require("../models/Transport");

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
      ...req.body,
      images: imageUrls
    });

    await transport.save();

    res.status(201).json(transport);

  } catch (error) {
    next(error);
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