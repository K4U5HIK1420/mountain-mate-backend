const Transport = require("../models/Transport");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { getDataStore } = require("../utils/dataStore");
const supabaseTransports = require("../services/supabaseTransportsStore");
const supabaseRideProducts = require("../services/supabaseRideProductsStore");
const { createNotification } = require("../services/notificationService");

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

function normalizeRideMode(value = "") {
  const mode = String(value || "").trim().toLowerCase();
  if (mode === "shared_taxi") return "shared_taxi";
  return "car_pooling";
}

function sanitizeTaxiSchedule(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function normalizePoint(raw) {
  if (!raw || typeof raw !== "object") return null;
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function getApproxDistanceKm(pointA, pointB) {
  if (!pointA || !pointB) return null;
  const earthKm = 6371;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);
  const lat1 = toRad(pointA.lat);
  const lat2 = toRad(pointB.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earthKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function fetchRoadRoutePreview(pickup, destination) {
  const coords = `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}`;
  const providers = [
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coords}?overview=full&geometries=geojson`,
  ];

  for (const url of providers) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) continue;

      const data = await response.json();
      const route = data?.routes?.[0];
      const geometry = route?.geometry?.coordinates;
      if (!Array.isArray(geometry) || geometry.length < 2) continue;

      return {
        source: "road_route",
        points: geometry.map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) })),
        distanceKm: Number(route.distance || 0) / 1000,
        durationMinutes: Number(route.duration || 0) / 60,
      };
    } catch (_error) {
      // Try the next provider before falling back to a direct line.
    }
  }

  return {
    source: "fallback_line",
    points: [pickup, destination],
    distanceKm: getApproxDistanceKm(pickup, destination),
    durationMinutes: null,
  };
}

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

async function uploadTransportAssets(files = {}) {
  const imageUrls = [];
  const verificationDocuments = {};
  const imageFiles = files.images || [];

  if (imageFiles.length > 0) {
    for (const file of imageFiles) {
      const result = await uploadFileToCloudinary(file, "mountain_mate/transports");
      imageUrls.push(result.secure_url);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
  }

  for (const field of TRANSPORT_DOC_FIELDS) {
    const file = files?.[field]?.[0];
    if (!file) {
      verificationDocuments[field] = "";
      continue;
    }

    const result = await uploadFileToCloudinary(file, "mountain_mate/transport_verification");
    verificationDocuments[field] = result.secure_url;
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }

  return {
    imageUrls,
    verificationDocuments,
  };
}

async function buildMergedRideAssets(existingRide, uploadedImageFiles = [], uploadedDocFiles = {}, complianceInput = {}) {
  const nextComplianceDetails = {
    ...(existingRide.complianceDetails || {}),
  };
  Object.entries(complianceInput).forEach(([key, value]) => {
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

  return {
    nextComplianceDetails,
    nextVerificationDocuments,
    nextImages,
  };
}

exports.addTransport = async (req, res) => {
  try {
    const missingFields = validateMandatoryRideCreate(req.body, req.files);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing mandatory fields: ${missingFields.join(", ")}`,
      });
    }

    const complianceDetails = buildTransportComplianceDetails(req.body);
    const { imageUrls, verificationDocuments } = await uploadTransportAssets(req.files || {});
    const rideMode = normalizeRideMode(req.body.rideMode);

    if (getDataStore() === "supabase") {
      if (rideMode === "shared_taxi") {
        const createdShared = await supabaseRideProducts.createSharedTaxiRide({
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
          message: "Shared taxi route is now live.",
          transport: createdShared,
        });
      }

      const created = await supabaseTransports.addTransport({
        ownerId: req.user.id,
        payload: {
          ...req.body,
          rideMode,
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
      rideMode,
      images: imageUrls,
      complianceDetails,
      verificationDocuments,
      status: "pending",
      isVerified: false,
    });

    await transport.save();

    return res.json({
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
    return res.status(400).json({ message: error.message });
  }
};

exports.getMyRides = async (req, res) => {
  try {
    if (getDataStore() === "supabase") {
      const [myRides, mySharedTaxis] = await Promise.all([
        supabaseTransports.getMyRides(req.user.id),
        supabaseRideProducts.getMySharedTaxiRides(req.user.id).catch(() => []),
      ]);

      const merged = [...myRides, ...mySharedTaxis].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      return res.json({ success: true, data: merged });
    }

    const myRides = await Transport.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return res.json({ success: true, data: myRides });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch your rides" });
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
      const sharedRide = await supabaseRideProducts.getSharedTaxiRideById(req.params.id).catch(() => null);

      if (sharedRide) {
        if (String(sharedRide.owner || "") !== String(req.user.id || "")) {
          return res.status(403).json({ message: "Not authorized to update this ride" });
        }

        const mergedAssets = await buildMergedRideAssets(
          sharedRide,
          uploadedImageFiles,
          uploadedDocFiles,
          buildTransportComplianceDetails(req.body)
        );

        const updateFields = {
          ...req.body,
          complianceDetails: mergedAssets.nextComplianceDetails,
          verificationDocuments: mergedAssets.nextVerificationDocuments,
          totalSeats: req.body.totalSeats || req.body.seatsAvailable,
        };
        if (hasUploadedFiles) updateFields.images = mergedAssets.nextImages;

        const updatedSharedRide = await supabaseRideProducts.updateSharedTaxiRide({
          ownerId: req.user.id,
          id: req.params.id,
          updateFields,
        });

        return res.json({
          success: true,
          message: "Shared taxi updated.",
          data: updatedSharedRide,
        });
      }

      const existing = await supabaseTransports.getRideById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Ride not found" });
      if (String(existing.owner || "") !== String(req.user.id || "")) {
        return res.status(403).json({ message: "Not authorized to update this ride" });
      }

      const mergedAssets = await buildMergedRideAssets(
        existing,
        uploadedImageFiles,
        uploadedDocFiles,
        buildTransportComplianceDetails(req.body)
      );

      const mergedUpdateFields = {
        ...req.body,
        complianceDetails: mergedAssets.nextComplianceDetails,
        verificationDocuments: mergedAssets.nextVerificationDocuments,
      };
      if (hasUploadedFiles) mergedUpdateFields.images = mergedAssets.nextImages;

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

    const mergedAssets = await buildMergedRideAssets(
      existingRide,
      uploadedImageFiles,
      uploadedDocFiles,
      buildTransportComplianceDetails(req.body)
    );

    const updatePayload = {
      ...req.body,
      complianceDetails: mergedAssets.nextComplianceDetails,
      verificationDocuments: mergedAssets.nextVerificationDocuments,
    };
    if (hasUploadedFiles) updatePayload.images = mergedAssets.nextImages;

    const updatedRide = await Transport.findByIdAndUpdate(req.params.id, { $set: updatePayload }, { new: true });

    return res.json({
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
    return res.status(500).json({ message: "Update failed" });
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

    return res.json({ success: true, message: "Seats reserved!", ride });
  } catch (error) {
    return res.status(500).json({ message: "Booking failed" });
  }
};

exports.getTransports = async (req, res) => {
  try {
    if (getDataStore() === "supabase") {
      const rides = await supabaseTransports.listApprovedRides({ date: req.query.date });
      return res.json(rides.filter((ride) => String(ride.rideMode || "car_pooling") !== "shared_taxi"));
    }

    const filters = {
      status: { $in: ["approved", "pending"] },
      seatsAvailable: { $gt: 0 },
    };

    const availableDate = buildDateFilter(req.query.date);
    if (availableDate) filters.availableDate = availableDate;

    const rides = await Transport.find(filters).sort({ availableDate: 1, createdAt: -1 });
    return res.json(rides);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch rides" });
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
      return res.json(transports.filter((ride) => String(ride.rideMode || "car_pooling") !== "shared_taxi"));
    }

    const { from = "", to = "" } = req.query;
    const filters = {
      routeFrom: { $regex: from, $options: "i" },
      routeTo: { $regex: to, $options: "i" },
      status: { $in: ["approved", "pending"] },
      seatsAvailable: { $gt: 0 },
    };

    const availableDate = buildDateFilter(req.query.date);
    if (availableDate) filters.availableDate = availableDate;

    const transports = await Transport.find(filters).sort({ availableDate: 1, createdAt: -1 });
    return res.json(transports);
  } catch (error) {
    return next(error);
  }
};

exports.getSharedTaxis = async (req, res) => {
  try {
    const rides = await supabaseRideProducts.listPublicSharedTaxiRides({ date: req.query.date || "" });
    return res.json({ success: true, data: rides });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch shared taxis." });
  }
};

exports.searchSharedTaxis = async (req, res) => {
  try {
    const rides = await supabaseRideProducts.listPublicSharedTaxiRides({
      from: req.query.from || "",
      to: req.query.to || "",
      date: req.query.date || "",
    });
    return res.json({ success: true, data: rides });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to search shared taxis." });
  }
};

exports.bookSharedTaxi = async (req, res) => {
  try {
    const actorId = String(req.user?.id || "");
    if (!actorId) return res.status(401).json({ success: false, message: "Login required." });

    const rideId = String(req.body.rideId || "");
    const seats = Math.max(1, Number(req.body.seats || 1));
    const customerName = String(req.body.customerName || "").trim();
    const customerPhone = String(req.body.customerPhone || "").trim();

    if (!rideId || !customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: "Passenger details are required." });
    }

    const ride = await supabaseRideProducts.getSharedTaxiRideById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Shared taxi not found." });
    }

    const reservation = await supabaseRideProducts.reserveSharedTaxiSeats({ rideId, seats });
    const refreshedRide = await supabaseRideProducts.getSharedTaxiRideById(rideId);

    await createNotification(
      {
        userId: ride.owner,
        title: "Shared taxi seats booked",
        message: `${customerName} booked ${seats} seat${seats > 1 ? "s" : ""} for ${ride.routeFrom} to ${ride.routeTo}.`,
        type: "shared_taxi_booking",
        data: { rideId, seats, customerName },
      },
      req.app.get("io")
    );

    return res.json({
      success: true,
      message: "Seats booked successfully.",
      data: {
        ride: refreshedRide,
        reservation,
        booking: {
          customerName,
          customerPhone,
          seats,
          totalAmount: Number(ride.pricePerSeat || 0) * seats,
          status: "confirmed",
        },
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Shared taxi booking failed." });
  }
};

exports.getTaxiQuote = async (req, res) => {
  try {
    const pickupLocation = String(req.body.pickupLocation || "").trim();
    const dropLocation = String(req.body.dropLocation || "").trim();
    const pickupCoords = req.body.pickupCoords || null;
    const dropCoords = req.body.dropCoords || null;

    if (!pickupLocation || !dropLocation || !pickupCoords || !dropCoords) {
      return res.status(400).json({ success: false, message: "Pickup, drop, and map coordinates are required." });
    }

    const quote = await supabaseRideProducts.estimateTaxiQuote({
      pickupCoords,
      dropCoords,
      rideDateTime: req.body.scheduledFor || null,
    });

    return res.json({ success: true, data: quote });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to estimate fare." });
  }
};

exports.bookTaxi = async (req, res) => {
  try {
    const actorId = String(req.user?.id || "");
    if (!actorId) return res.status(401).json({ success: false, message: "Login required." });

    const scheduledFor = sanitizeTaxiSchedule(req.body.scheduledFor);
    if (!scheduledFor) {
      return res.status(400).json({ success: false, message: "Choose a valid pickup time." });
    }

    const pickupLocation = String(req.body.pickupLocation || "").trim();
    const dropLocation = String(req.body.dropLocation || "").trim();
    const customerName = String(req.body.customerName || "").trim();
    const customerPhone = String(req.body.customerPhone || "").trim();
    if (!pickupLocation || !dropLocation || !customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: "Complete all booking details." });
    }

    const quote = await supabaseRideProducts.estimateTaxiQuote({
      pickupCoords: req.body.pickupCoords || null,
      dropCoords: req.body.dropCoords || null,
      rideDateTime: scheduledFor,
    });

    const taxiBooking = await supabaseRideProducts.createTaxiBooking({
      userId: actorId,
      payload: {
        customerName,
        customerPhone,
        pickupLocation,
        dropLocation,
        pickupCoords: req.body.pickupCoords || null,
        dropCoords: req.body.dropCoords || null,
        scheduledFor,
        distanceKm: quote.distanceKm,
        estimatedFare: quote.estimatedFare,
        pricingMeta: {
          ...quote.pricing,
          source: quote.source,
          durationMinutes: quote.durationMinutes,
        },
      },
    });

    if (taxiBooking.driverId) {
      await createNotification(
        {
          userId: taxiBooking.driverId,
          title: "New private cab request",
          message: `${customerName} requested a private cab from ${pickupLocation} to ${dropLocation}.`,
          type: "taxi_booking",
          data: { bookingId: taxiBooking._id, status: taxiBooking.status },
        },
        req.app.get("io")
      );
    }

    await createNotification(
      {
        userId: actorId,
        title: taxiBooking.status === "confirmed" ? "Private cab confirmed" : "Private cab request received",
        message:
          taxiBooking.status === "confirmed"
            ? `Your taxi for ${pickupLocation} to ${dropLocation} is confirmed.`
            : `We received your taxi request for ${pickupLocation} to ${dropLocation}.`,
        type: "taxi_booking",
        data: { bookingId: taxiBooking._id, status: taxiBooking.status },
      },
      req.app.get("io")
    );

    return res.status(201).json({ success: true, data: taxiBooking });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Taxi booking failed." });
  }
};

exports.updateTaxiBookingStatus = async (req, res) => {
  try {
    const actorId = String(req.user?.id || "");
    if (!actorId) return res.status(401).json({ success: false, message: "Login required." });

    const bookingId = String(req.body.bookingId || "");
    const status = String(req.body.status || "").trim().toLowerCase();
    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Taxi booking id is required." });
    }

    const updatedBooking = await supabaseRideProducts.updateTaxiBookingStatus({
      bookingId,
      driverId: actorId,
      status,
    });

    await createNotification(
      {
        userId: updatedBooking.userId,
        title: status === "confirmed" ? "Private cab confirmed" : "Private cab declined",
        message:
          status === "confirmed"
            ? `Your taxi for ${updatedBooking.pickupLocation} to ${updatedBooking.dropLocation} has been confirmed by a driver.`
            : `Your taxi for ${updatedBooking.pickupLocation} to ${updatedBooking.dropLocation} was declined by the driver.`,
        type: "taxi_booking",
        data: { bookingId: updatedBooking._id, status: updatedBooking.status },
      },
      req.app.get("io")
    );

    return res.json({ success: true, data: updatedBooking });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to update taxi booking." });
  }
};

exports.getRoutePreview = async (req, res) => {
  try {
    const pickup = normalizePoint(req.body.pickupCoords);
    const destination = normalizePoint(req.body.destinationCoords);
    if (!pickup || !destination) {
      return res.status(400).json({
        success: false,
        message: "Pickup and destination coordinates are required.",
      });
    }

    const route = await fetchRoadRoutePreview(pickup, destination);
    return res.json({ success: true, data: route });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to build route preview.",
    });
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

    return res.status(400).json({ message: "Invalid action" });
  } catch (error) {
    return res.status(500).json({ message: "Verification failed" });
  }
};

exports.getAllRidesForAdmin = async (req, res) => {
  try {
    if (getDataStore() === "supabase") {
      const rides = await supabaseTransports.listAllRides();
      return res.json(rides);
    }

    const rides = await Transport.find().sort({ createdAt: -1 });
    return res.json(rides);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch admin data" });
  }
};
