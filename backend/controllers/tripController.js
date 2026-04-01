const Trip = require("../models/Trip");
const { resolveAppUser } = require("../utils/resolveAppUser");

/**
 * @desc    Create a new tactical itinerary
 * @route   POST /api/trips
 * @access  Private
 */
exports.createTrip = async (req, res, next) => {
  try {
    const { title, itinerary } = req.body || {};
    const user = await resolveAppUser(req);
    
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: "Expedition Title is required." 
      });
    }

    const trip = await Trip.create({
      userId: String(user?._id || req.user?.id || req.user?._id || ""),
      title: String(title).trim(),
      itinerary: Array.isArray(itinerary)
        ? itinerary.map((d, idx) => ({
            day: Number(d.day ?? idx + 1),
            title: d.title || "",
            location: d.location || "",
            activity: d.activity || "",
          }))
        : [],
    });

    return res.status(201).json({ 
      success: true, 
      data: trip 
    });
  } catch (err) {
    console.error("Create Trip Error:", err.message);
    next(err);
  }
};

/**
 * @desc    Get all trips for the logged-in explorer
 * @route   GET /api/trips/my-trips
 * @access  Private
 */
exports.getMyTrips = async (req, res, next) => {
  try {
    const user = await resolveAppUser(req);
    const ownerId = String(user?._id || req.user?.id || req.user?._id || "");
    const trips = await Trip.find({ userId: ownerId }).sort({ createdAt: -1 });
    return res.json({ 
      success: true, 
      count: trips.length,
      data: trips 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update an existing itinerary
 * @route   PUT /api/trips/:id
 * @access  Private
 */
exports.updateTrip = async (req, res, next) => {
  try {
    const { title, itinerary } = req.body || {};
    const user = await resolveAppUser(req);
    const update = {};

    if (typeof title === "string" && title.trim()) update.title = title.trim();
    if (Array.isArray(itinerary)) update.itinerary = itinerary;

    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: String(user?._id || req.user?.id || req.user?._id || "") },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        message: "Expedition data not found or unauthorized access." 
      });
    }

    return res.json({ 
      success: true, 
      data: trip 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a trip/expedition
 * @route   DELETE /api/trips/:id
 * @access  Private
 */
exports.deleteTrip = async (req, res, next) => {
  try {
    const user = await resolveAppUser(req);
    const trip = await Trip.findOneAndDelete({ 
      _id: req.params.id, 
      userId: String(user?._id || req.user?.id || req.user?._id || "") 
    });

    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        message: "Expedition data not found." 
      });
    }

    return res.json({ 
      success: true, 
      message: "Trip successfully scrubbed from telemetry." 
    });
  } catch (err) {
    next(err);
  }
};
