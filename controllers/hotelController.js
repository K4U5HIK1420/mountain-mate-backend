const Hotel = require("../models/Hotel");

// Add Hotel
exports.addHotel = async (req, res) => {
    try {
        const hotel = new Hotel(req.body);
        await hotel.save();
        res.status(201).json(hotel);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Hotels
exports.getHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find();
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search Hotels with Filters
exports.searchHotels = async (req, res) => {
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
        res.status(500).json({ message: error.message });
    }
};
