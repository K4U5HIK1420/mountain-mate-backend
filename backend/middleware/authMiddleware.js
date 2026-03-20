const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      message: "Access denied. Please login again." 
    });
  }

  // "Bearer TOKEN_STRING" -> TOKEN_STRING
  const token = authHeader.split(" ")[1];

  try {
    // Token verify karna
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ req.user ko set karna (Controller isi ko use karega)
    req.user = decoded; 
    
    // Admin access ke liye bhi compatibility rakh rahe hain
    req.admin = decoded;

    next();
  } catch (error) {
    // Agar token expire ho gaya ho toh user ko batao
    const msg = error.name === "TokenExpiredError" ? "Session expired. Login again." : "Invalid session.";
    
    return res.status(401).json({ 
      success: false, 
      message: msg 
    });
  }
};