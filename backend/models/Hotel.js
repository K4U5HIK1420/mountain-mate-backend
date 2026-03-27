const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
    hotelName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    pricePerNight: {
        type: Number,
        required: true
    },
    roomsAvailable: {
        type: Number,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    images: {
        type: [String]
    },
    complianceDetails: {
        ownerAadhaarNumber: { type: String, default: "" },
        ownerPanNumber: { type: String, default: "" },
        gstNumber: { type: String, default: "" },
        registrationNumber: { type: String, default: "" },
        tradeLicenseNumber: { type: String, default: "" },
        fireSafetyCertificateNumber: { type: String, default: "" },
        bankAccountHolder: { type: String, default: "" },
        bankAccountNumber: { type: String, default: "" },
        ifscCode: { type: String, default: "" }
    },
    verificationDocuments: {
        ownerPhoto: { type: String, default: "" },
        ownerAadhaarDoc: { type: String, default: "" },
        ownerPanDoc: { type: String, default: "" },
        propertyRegistrationDoc: { type: String, default: "" },
        tradeLicenseDoc: { type: String, default: "" },
        gstCertificateDoc: { type: String, default: "" },
        fireSafetyDoc: { type: String, default: "" }
    },
    // --- OWNER LINKING (Naya Field) ---
    owner: {
        // Supabase uses UUID strings; legacy records may still have ObjectId.
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    // --- APPROVED LOGIC ---
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    status: {
        type: String,
        enum: ["pending", "approved"],
        default: "pending"
    }
}, 
{ timestamps: true });

module.exports = mongoose.model("Hotel", hotelSchema);
