const Booking = require("../models/Booking");

// Create Booking
exports.createBooking = async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Bookings
exports.getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate("listingId");
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Booking Status
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
