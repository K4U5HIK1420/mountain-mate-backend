const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 1. REGISTER ADMIN
exports.registerAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) return res.status(400).json({ message: "Admin already deployed!" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = new Admin({
            email,
            password: hashedPassword,
            role: "admin" // ✅ Role specify karna zaroori hai middleware ke liye
        });

        await admin.save();
        res.status(201).json({ success: true, message: "Admin Uplink Established" });

    } catch (error) {
        next(error);
    }
};

// 2. LOGIN ADMIN
exports.loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({ success: false, message: "Unauthorized: Admin node not found" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Tactical Error: Invalid Credentials" });
        }

        // ✅ JWT Payload mein role bhi bhej rahe hain taaki frontend/middleware ko pata rahe
        const token = jwt.sign(
            { id: admin._id, role: "admin" }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );

        res.json({ 
            success: true,
            token, 
            admin: { id: admin._id, email: admin.email, role: "admin" } 
        });

    } catch (error) {
        next(error);
    }
};