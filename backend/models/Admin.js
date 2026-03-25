const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required for the sentinel"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Uplink ID (Email) is required"],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Security Key (Password) is mandatory"],
        minlength: 8,
        select: false // Login ke ilawa ye password fetch nahi hoga (Security++)
    },
    role: {
        type: String,
        enum: ["admin", "superadmin", "moderator"],
        default: "admin"
    },
    lastLogin: {
        type: Date
    }
}, { 
    timestamps: true // Isse createdAt aur updatedAt apne aap ban jayenge
});

// ✅ Password Hashing before saving
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// ✅ Method to check password during login
adminSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model("Admin", adminSchema);