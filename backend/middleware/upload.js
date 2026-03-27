const multer = require("multer");
const path = require("path");

// Temporary disk storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Sabse pehle 'uploads' naam ka folder root mein bana lena
    },
    filename: function (req, file, cb) {
        // Filename ko unique banane ke liye timestamp add karna
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// File filter (images + PDFs for verification documents)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, WEBP and PDF are allowed."), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
    fileFilter: fileFilter
});

module.exports = upload;
