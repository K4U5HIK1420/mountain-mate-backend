const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Debugging ke liye log
  console.log("AUTH HEADER RECEIVED:", req.headers.authorization);

  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // "Bearer TOKEN_STRING" se TOKEN_STRING nikalna
  const token = authHeader.split(" ")[1]; 

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing after Bearer prefix." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIXED: req.user mein data daal rahe hain taaki controller 'req.user.id' padh sake
    req.user = decoded; 
    
    // Safety ke liye req.admin bhi rakh rahe hain agar kahin aur use ho raha ho
    req.admin = decoded;

    console.log("DECODED USER ID:", req.user.id); // Console check karo

    next();
  } catch (error) {
    console.error("JWT ERROR:", error.message);
    res.status(400).json({ message: "Invalid token" });
  }
};