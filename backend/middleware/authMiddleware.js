const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Debugging: Request headers check
  console.log("--- AUTH CHECK START ---");
  const authHeader = req.headers["authorization"];
  console.log("Raw Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ ERROR: No Bearer token found");
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

    console.log("✅ AUTH SUCCESS: User ID -", decoded.id);
    console.log("--- AUTH CHECK END ---");

    next();
  } catch (error) {
    console.error("❌ JWT ERROR:", error.message);
    
    // Agar token expire ho gaya ho toh user ko batao
    const msg = error.name === "TokenExpiredError" ? "Session expired. Login again." : "Invalid session.";
    
    return res.status(401).json({ 
      success: false, 
      message: msg 
    });
  }
};