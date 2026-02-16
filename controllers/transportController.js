const Transport = require("../models/Transport");

// Add Transport
exports.addTransport = async (req, res) => {
    try {
        const transport = new Transport(req.body);
        await transport.save();
        res.status(201).json(transport);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Transports
exports.getTransports = async (req, res) => {
    try {
        const transports = await Transport.find();
        res.json(transports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search Transport by Route
exports.searchTransport = async (req, res) => {
    try {
        const { from, to } = req.query;

        const transports = await Transport.find({
            routeFrom: { $regex: from, $options: "i" },
            routeTo: { $regex: to, $options: "i" }
        });

        res.json(transports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
