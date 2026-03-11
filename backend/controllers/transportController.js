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
exports.getTransports = async (req, res, next) => {
    try {
        const transports = await Transport.find();
        res.json(transports);
    } catch (error) {
        next(error);
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
