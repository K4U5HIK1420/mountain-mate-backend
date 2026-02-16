const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, "SECRET_KEY");
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid token" });
    }
};
