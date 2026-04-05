const Transport = require("../models/Transport");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { getDataStore } = require("../utils/dataStore");
const supabaseTransports = require("../services/supabaseTransportsStore");

const TRANSPORT_DOC_FIELDS = [
  "driverPhoto",
  "driverLicenseDoc",
  "driverAadhaarDoc",
  "vehicleRcDoc",
  "vehicleInsuranceDoc",
  "vehiclePermitDoc",
  "pollutionCertificateDoc",
  "fitnessCertificateDoc",
];

const buildDateFilter = (date) => {
  if (!date) return null;

  const start = new Date(date);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { $gte: start, $lt: end };
};

function buildTransportComplianceDetails(body = {}) {
  return {
    driverLicenseNumber: body.driverLicenseNumber || "",
    driverAadhaarNumber: body.driverAadhaarNumber || "",
    driverPanNumber: body.driverPanNumber || "",
    rcNumber: body.rcNumber || "",
    insurancePolicyNumber: body.insurancePolicyNumber || "",
    permitNumber: body.permitNumber || "",
    pollutionCertificateNumber: body.pollutionCertificateNumber || "",
    fitnessCertificateNumber: body.fitnessCertificateNumber || "",
  };
}

function uploadFileToCloudinary(file, folder) {
  return cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: "auto",
  });
}

function validateMandatoryRideCreate(body = {}, files = {}) {
  const requiredTextFields = [
    "vehicleModel",
    "plateNumber",
    "driverName",
    "contactNumber",
    "driverLicenseNumber",
    "driverAadhaarNumber",
    "routeFrom",
    "routeTo",
  ];

  const missing = requiredTextFields.filter((key) => !String(body[key] || "").trim());
  const aadhaarFile = files?.driverAadhaarDoc?.[0];
  if (!aadhaarFile) missing.push("driverAadhaarDoc");

  return missing;
}

exports.addTransport = async (req, res) => {
  try {
    const missingFields = validateMandatoryRideCreate(req.body, req.files);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing mandatory fields: ${missingFields.join(", ")}`,
      });
    }

    const imageUrls = [];
    const verificationDocuments = {};
    const imageFiles = req.files?.images || [];

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const result = await uploadFileToCloudinary(file, "mountain_mate/transports");
        imageUrls.push(result.secure_url);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    for (const field of TRANSPORT_DOC_FIELDS) {
      const file = req.files?.[field]?.[0];
      if (!file) {
        verificationDocuments[field] = "";
        continue;
      }

      const result = await uploadFileToCloudinary(file, "mountain_mate/transport_verification");
      verificationDocuments[field] = result.secure_url;
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }

    const complianceDetails = buildTransportComplianceDetails(req.body);

    if (getDataStore() === "supabase") {
      const created = await supabaseTransports.addTransport({
        ownerId: req.user.id,
        payload: {
          ...req.body,
          images: imageUrls,
          complianceDetails,
          verificationDocuments,
        },
      });

      return res.json({
        success: true,
        message: "Fleet Transmission Successful!",
        transport: created,
      });
    }

    const transport = new Transport({
      owner: req.user.id,
      vehicleModel: req.body.vehicleModel,
      vehicleType: req.body.vehicleType,
      plateNumber: req.body.plateNumber,
      routeFrom: req.body.routeFrom,
      routeTo: req.body.routeTo,
      availableDate: req.body.availableDate || null,
      fromCoords: JSON.parse(req.body.fromCoords),
      toCoords: JSON.parse(req.body.toCoords),
      pricePerSeat: req.body.pricePerSeat,
      seatsAvailable: req.body.seatsAvailable,
      driverName: req.body.driverName || req.user.name,
      contactNumber: req.body.contactNumber,
      images: imageUrls,
      complianceDetails,
      verificationDocuments,
      status: "pending",
      isVerified: false,
    });

    await transport.save();

    res.json({
      success: true,
      message: "Fleet Transmission Successful!",
      transport,
    });
  } catch (error) {
    if (req.files) {
      Object.values(req.files).flat().forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.getMyRides = async (req, res) => {
  try {
    if (getDataStore() === "supabase") {
      const myRides = await supabaseTransports.getMyRides(req.user.id);
      return res.json({ success: true, data: myRides });
    }

    const myRides = await Transport.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: myRides });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your rides" });
  }
};

exports.updateTransport = async (req, res) => {
  try {
    const uploadedImageFiles = req.files?.images || [];
    const uploadedDocFiles = {};
    for (const field of TRANSPORT_DOC_FIELDS) {
      const file = req.files?.[field]?.[0];
      if (file) uploadedDocFiles[field] = file;
    }

    const hasUploadedFiles = uploadedImageFiles.length > 0 || Object.keys(uploadedDocFiles).length > 0;

    if (getDataStore() === "supabase") {
      const existing = await supabaseTransports.getRideById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Ride not found" });
      if (String(existing.owner || "") !== String(req.user.id || "")) {
        return res.status(403).json({ message: "Not authorized to update this ride" });
      }

      const nextComplianceDetails = {
        ...(existing.complianceDetails || {}),
      };
      const incomingCompliance = buildTransportComplianceDetails(req.body);
      Object.entries(incomingCompliance).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          nextComplianceDetails[key] = value;
        }
      });

      const nextVerificationDocuments = {
        ...(existing.verificationDocuments || {}),
      };
      for (const field of Object.keys(uploadedDocFiles)) {
        const result = await uploadFileToCloudinary(uploadedDocFiles[field], "mountain_mate/transport_verification");
        nextVerificationDocuments[field] = result.secure_url;
        if (fs.existsSync(uploadedDocFiles[field].path)) fs.unlinkSync(uploadedDocFiles[field].path);
      }

      let nextImages = Array.isArray(existing.images) ? [...existing.images] : [];
      for (const file of uploadedImageFiles) {
        const result = await uploadFileToCloudinary(file, "mountain_mate/transports");
        nextImages.push(result.secure_url);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }

      const mergedUpdateFields = {
        ...req.body,
        complianceDetails: nextComplianceDetails,
        verificationDocuments: nextVerificationDocuments,
      };
      if (hasUploadedFiles) {
        mergedUpdateFields.images = nextImages;
      }

      const updated = await supabaseTransports.updateTransport({
        ownerId: req.user.id,
        id: req.params.id,
        updateFields: mergedUpdateFields,
      });

      return res.json({
        success: true,
        message: "Fleet Data Updated!",
        data: updated,
      });
    }

    const existingRide = await Transport.findById(req.params.id);
    if (!existingRide) return res.status(404).json({ message: "Ride not found" });
    if (String(existingRide.owner || "") !== String(req.user.id || "")) {
      return res.status(403).json({ message: "Not authorized to update this ride" });
    }

    const nextComplianceDetails = {
      ...(existingRide.complianceDetails || {}),
    };
    const incomingCompliance = buildTransportComplianceDetails(req.body);
    Object.entries(incomingCompliance).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        nextComplianceDetails[key] = value;
      }
    });

    const nextVerificationDocuments = {
      ...(existingRide.verificationDocuments || {}),
    };
    for (const field of Object.keys(uploadedDocFiles)) {
      const result = await uploadFileToCloudinary(uploadedDocFiles[field], "mountain_mate/transport_verification");
      nextVerificationDocuments[field] = result.secure_url;
      if (fs.existsSync(uploadedDocFiles[field].path)) fs.unlinkSync(uploadedDocFiles[field].path);
    }

    let nextImages = Array.isArray(existingRide.images) ? [...existingRide.images] : [];
    for (const file of uploadedImageFiles) {
      const result = await uploadFileToCloudinary(file, "mountain_mate/transports");
      nextImages.push(result.secure_url);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }

    const updatePayload = {
      ...req.body,
      complianceDetails: nextComplianceDetails,
      verificationDocuments: nextVerificationDocuments,
    };
    if (hasUploadedFiles) {
      updatePayload.images = nextImages;
    }

    const updatedRide = await Transport.findByIdAndUpdate(req.params.id, { $set: updatePayload }, { new: true });

    res.json({
      success: true,
      message: "Fleet Data Updated!",
      data: updatedRide,
    });
  } catch (error) {
    if (req.files) {
      Object.values(req.files).flat().forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ message: "Update failed" });
  }
};

exports.bookRide = async (req, res) => {
  try {
    const { rideId, seats } = req.body;
    const ride = await Transport.findById(rideId);

    if (!ride || ride.seatsAvailable < seats) {
      return res.status(400).json({ message: "No seats!" });
    }

    ride.seatsAvailable -= seats;
    await ride.save();

    res.json({ success: true, message: "Seats reserved!", ride });
  } catch (error) {
    res.status(500).json({ message: "Booking failed" });
  }
};

exports.getTransports = async (req, res) => {
  try {
    if (getDataStore() === "supabase") {
      const rides = await supabaseTransports.listApprovedRides({ date: req.query.date });
      return res.json(rides);
    }

    const filters = {
      status: "approved",
      isVerified: true,
      seatsAvailable: { $gt: 0 },
    };

    const availableDate = buildDateFilter(req.query.date);
    if (availableDate) {
      filters.availableDate = availableDate;
    }

    const rides = await Transport.find(filters).sort({ availableDate: 1, createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rides" });
  }
};

exports.searchTransport = async (req, res, next) => {
  try {
    if (getDataStore() === "supabase") {
      const transports = await supabaseTransports.searchApprovedRides({
        from: req.query.from || "",
        to: req.query.to || "",
        date: req.query.date,
      });
      return res.json(transports);
    }

    const { from = "", to = "" } = req.query;
    const filters = {
      routeFrom: { $regex: from, $options: "i" },
      routeTo: { $regex: to, $options: "i" },
      status: "approved",
      isVerified: true,
      seatsAvailable: { $gt: 0 },
    };

    const availableDate = buildDateFilter(req.query.date);
    if (availableDate) {
      filters.availableDate = availableDate;
    }

    const transports = await Transport.find(filters).sort({ availableDate: 1, createdAt: -1 });
    res.json(transports);
  } catch (error) {
    next(error);
  }
};

exports.verifyTransport = async (req, res) => {
  try {
    const { rideId, action } = req.body;
    const ride = await Transport.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (action === "approved") {
      ride.isVerified = true;
      ride.status = "approved";
      await ride.save();

      const io = req.app.get("io");
      if (io) {
        io.emit("fleetUpdate", { rideId: ride._id, status: "live" });
      }

      return res.json({ success: true, message: "Ride approved and live!", ride });
    }

    if (action === "rejected") {
      await Transport.findByIdAndDelete(rideId);
      return res.json({ success: true, message: "Ride rejected and removed" });
    }
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
};

exports.getAllRidesForAdmin = async (req, res) => {
  try {
    if (getDataStore() === "supabase") {
      const rides = await supabaseTransports.listAllRides();
      return res.json(rides);
    }

    const rides = await Transport.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin data" });
  }
};
