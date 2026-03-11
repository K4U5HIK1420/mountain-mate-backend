const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  console.log("AUTH HEADER:", req.headers.authorization);

  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1]; // remove "Bearer"

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = decoded;

    next();

  } catch (error) {

    res.status(400).json({ message: "Invalid token" });

  }
};