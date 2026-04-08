import React, { useEffect, useState } from "react";
import API from "../utils/api";
import { motion } from "framer-motion";
import { Calendar, Car, Crosshair, IndianRupee, Loader2, MapPin, Navigation, Save, Users } from "lucide-react";
import { useNotify } from "../context/NotificationContext";
import { geocodePlace, getBrowserLocation, reverseGeocode } from "../utils/location";
import {
  cleanValue,
  digitsOnly,
  isValidAadhaar,
  isValidPan,
  isValidPhone,
  isValidVehiclePlate,
  normalizePan,
  normalizePhone,
  normalizeVehiclePlate,
} from "../utils/validation";

const hubs = ["Guptakashi", "Sonprayag", "Phata", "Rudraprayag", "Rishikesh", "Dehradun", "Haridwar", "Joshimath"];
const complianceFields = [
  ["driverLicenseNumber", "Driver License No"],
  ["driverAadhaarNumber", "Driver Aadhaar No"],
  ["driverPanNumber", "Driver PAN No"],
  ["rcNumber", "RC Number"],
  ["insurancePolicyNumber", "Insurance Policy No"],
  ["permitNumber", "Permit Number"],
  ["pollutionCertificateNumber", "PUC Number"],
  ["fitnessCertificateNumber", "Fitness Certificate No"],
];
const documentFields = [
  ["driverPhoto", "Driver Photo"],
  ["driverLicenseDoc", "Driver License Scan"],
  ["driverAadhaarDoc", "Driver Aadhaar Scan"],
  ["vehicleRcDoc", "Vehicle RC"],
  ["vehicleInsuranceDoc", "Vehicle Insurance"],
  ["vehiclePermitDoc", "Tourist/Commercial Permit"],
  ["pollutionCertificateDoc", "PUC Certificate"],
  ["fitnessCertificateDoc", "Fitness Certificate"],
];

export default function ManageRides() {
  const { notify } = useNotify();
  const [myRides, setMyRides] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [locatingId, setLocatingId] = useState("");
  const [togglingId, setTogglingId] = useState("");

  useEffect(() => {
    const fetchMyFleet = async () => {
      try {
        const res = await API.get("/transport/my-rides");
        const rides = res.data?.data || res.data || [];
        setMyRides(rides);
        setDrafts(
          Object.fromEntries(
            rides.map((ride) => [
              ride._id,
              {
                routeFrom: ride.routeFrom || "",
                routeTo: ride.routeTo || "",
                availableDate: ride.availableDate ? String(ride.availableDate).split("T")[0] : "",
                seatsAvailable: ride.seatsAvailable || 1,
                pricePerSeat: ride.pricePerSeat || 0,
                fromCoords: ride.fromCoords || null,
                toCoords: ride.toCoords || null,
                driverOnline: ride.driverOnline ?? true,
                vehicleModel: ride.vehicleModel || "",
                plateNumber: ride.plateNumber || "",
                driverName: ride.driverName || "",
                contactNumber: ride.contactNumber || "",
                driverLicenseNumber: ride.complianceDetails?.driverLicenseNumber || "",
                driverAadhaarNumber: ride.complianceDetails?.driverAadhaarNumber || "",
                driverPanNumber: ride.complianceDetails?.driverPanNumber || "",
                rcNumber: ride.complianceDetails?.rcNumber || "",
                insurancePolicyNumber: ride.complianceDetails?.insurancePolicyNumber || "",
                permitNumber: ride.complianceDetails?.permitNumber || "",
                pollutionCertificateNumber: ride.complianceDetails?.pollutionCertificateNumber || "",
                fitnessCertificateNumber: ride.complianceDetails?.fitnessCertificateNumber || "",
                newImages: [],
                docFiles: {},
              },
            ])
          )
        );
      } catch (_err) {
        notify("Fleet link failed", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchMyFleet();
  }, [notify]);

  const setDraft = (rideId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [rideId]: { ...(prev[rideId] || {}), ...patch },
    }));
  };

  const validateRideDraft = (draft, { routeOnly = false } = {}) => {
    if (!cleanValue(draft.routeFrom) || !cleanValue(draft.routeTo)) {
      return "Add both source and destination.";
    }
    if (cleanValue(draft.routeFrom).toLowerCase() === cleanValue(draft.routeTo).toLowerCase()) {
      return "Source and destination should be different.";
    }
    if (routeOnly) return "";
    if (cleanValue(draft.contactNumber) && !isValidPhone(draft.contactNumber)) {
      return "Enter a valid driver contact number.";
    }
    if (cleanValue(draft.plateNumber) && !isValidVehiclePlate(draft.plateNumber)) {
      return "Enter a valid vehicle number.";
    }
    if (cleanValue(draft.driverAadhaarNumber) && !isValidAadhaar(draft.driverAadhaarNumber)) {
      return "Enter a valid Aadhaar number.";
    }
    if (cleanValue(draft.driverPanNumber) && !isValidPan(draft.driverPanNumber)) {
      return "Enter a valid PAN number.";
    }
    return "";
  };

  const captureLiveLocation = (rideId) => {
    setLocatingId(rideId);
    getBrowserLocation()
      .then(async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const label = await reverseGeocode(coords.lat, coords.lng);
        setDraft(rideId, { routeFrom: label, fromCoords: coords });
        setLocatingId("");
        notify("Driver live location captured.", "success");
      })
      .catch(() => {
        setLocatingId("");
        notify("Allow location access to use your exact pickup point.", "error");
      });
  };

  const republishRide = async (ride) => {
    const draft = drafts[ride._id];
    const routeError = validateRideDraft(draft || {}, { routeOnly: true });
    if (routeError) {
      notify(routeError, "error");
      return;
    }

    setSavingId(`route-${ride._id}`);
    try {
      const [fromCoords, toCoords] = await Promise.all([
        draft.fromCoords || geocodePlace(draft.routeFrom),
        draft.toCoords || geocodePlace(draft.routeTo),
      ]);
      if (!fromCoords || !toCoords) {
        notify("Could not map the selected route right now. Try a clearer town name.", "error");
        return;
      }
      const payload = {
        routeFrom: cleanValue(draft.routeFrom),
        routeTo: cleanValue(draft.routeTo),
        availableDate: draft.availableDate || null,
        fromCoords,
        toCoords,
        seatsAvailable: Number(draft.seatsAvailable || ride.seatsAvailable || 1),
        pricePerSeat: Number(draft.pricePerSeat || ride.pricePerSeat || 0),
        driverOnline: draft.driverOnline ?? ride.driverOnline ?? true,
      };

      const res = await API.patch(`/transport/update/${ride._id}`, payload);
      const updated = res.data?.data || { ...ride, ...payload };
      setMyRides((prev) => prev.map((item) => (item._id === ride._id ? { ...item, ...updated } : item)));
      notify("Ride updated live for riders.", "success");
    } catch (_err) {
      notify("Unable to update route right now.", "error");
    } finally {
      setSavingId("");
    }
  };

  const onNewImagesPicked = (rideId, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setDraft(rideId, {
      newImages: [...(drafts[rideId]?.newImages || []), ...files],
    });
  };

  const onDocumentPicked = (rideId, fieldKey, file) => {
    setDraft(rideId, {
      docFiles: {
        ...(drafts[rideId]?.docFiles || {}),
        [fieldKey]: file || null,
      },
    });
  };

  const saveOptionalDetails = async (ride) => {
    const draft = drafts[ride._id] || {};
    const validationError = validateRideDraft(draft);
    if (validationError) {
      notify(validationError, "error");
      return;
    }
    setSavingId(`optional-${ride._id}`);
    try {
      const data = new FormData();
      data.append("vehicleModel", draft.vehicleModel || ride.vehicleModel || "");
      data.append("plateNumber", normalizeVehiclePlate(draft.plateNumber || ride.plateNumber || ""));
      data.append("driverName", draft.driverName || ride.driverName || "");
      data.append("contactNumber", normalizePhone(draft.contactNumber || ride.contactNumber || ""));
      data.append("pricePerSeat", String(draft.pricePerSeat ?? ride.pricePerSeat ?? 0));
      data.append("seatsAvailable", String(draft.seatsAvailable ?? ride.seatsAvailable ?? 1));

      complianceFields.forEach(([key]) => {
        let val = draft[key];
        if (key === "driverAadhaarNumber") val = digitsOnly(val);
        if (key === "driverPanNumber") val = normalizePan(val);
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          data.append(key, String(val));
        }
      });

      (draft.newImages || []).forEach((file) => data.append("images", file));
      Object.entries(draft.docFiles || {}).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });

      const res = await API.patch(`/transport/update/${ride._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res.data?.data || ride;
      setMyRides((prev) => prev.map((item) => (item._id === ride._id ? { ...item, ...updated } : item)));
      setDraft(ride._id, {
        ...draft,
        newImages: [],
        docFiles: {},
      });
      notify("Optional details saved successfully.", "success");
    } catch (_err) {
      notify("Optional details save failed.", "error");
    } finally {
      setSavingId("");
    }
  };

  const toggleDriverOnline = async (ride) => {
    const nextOnline = !(drafts[ride._id]?.driverOnline ?? ride.driverOnline ?? true);
    setDraft(ride._id, { driverOnline: nextOnline });
    setTogglingId(ride._id);
    try {
      const res = await API.patch(`/transport/update/${ride._id}`, { driverOnline: nextOnline });
      const updated = res.data?.data || { ...ride, driverOnline: nextOnline };
      setMyRides((prev) => prev.map((item) => (item._id === ride._id ? { ...item, ...updated } : item)));
      notify(nextOnline ? "Driver is now online." : "Driver is now offline.", nextOnline ? "success" : "error");
    } catch {
      setDraft(ride._id, { driverOnline: ride.driverOnline ?? true });
      notify("Unable to update online status right now.", "error");
    } finally {
      setTogglingId("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505]">
        <Loader2 className="animate-spin text-orange-500" size={46} />
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic">Syncing fleet...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] px-6 pb-24 pt-40 text-white">
      <div className="fixed inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500" className="h-full w-full object-cover opacity-10 grayscale" alt="Fleet background" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#050505] to-orange-950/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-20 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-300">Route Control</p>
            <h1 className="mt-4 text-6xl font-black uppercase italic tracking-[-0.05em] text-white md:text-8xl">
              Fleet <span className="bg-gradient-to-r from-orange-400 to-orange-700 bg-clip-text text-transparent">republish.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-white/58 md:text-base">
              When the driver reaches a new town, update the route here and publish the next day’s journey from the new location to wherever the vehicle is going next.
            </p>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] px-8 py-6 backdrop-blur-2xl">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Operational Units</p>
            <p className="mt-2 text-4xl font-black italic text-white">{String(myRides.length).padStart(2, "0")}</p>
          </div>
        </div>

        <div className="grid gap-8">
          {myRides.length === 0 ? (
            <div className="rounded-[40px] border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-white/35">
              <Car size={28} className="mx-auto mb-4 text-orange-400/70" />
              <p className="text-2xl font-black uppercase italic tracking-tight text-white">No rides listed</p>
            </div>
          ) : (
            myRides.map((ride, index) => {
              const draft = drafts[ride._id] || {};
              return (
                <motion.div
                  key={ride._id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="rounded-[42px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-3xl"
                >
                  <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/5 text-orange-400">
                          <Car size={28} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/28">{ride.plateNumber}</p>
                          <h2 className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white">{ride.vehicleModel}</h2>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
                          Current: {ride.routeFrom} to {ride.routeTo}
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                          Seats: {ride.seatsAvailable}
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                          Date: {draft.availableDate || (ride.availableDate ? new Date(ride.availableDate).toLocaleDateString() : "Not set")}
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                          Fare: Rs {draft.pricePerSeat ?? ride.pricePerSeat}
                        </div>
                        <div className={`rounded-full border px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] ${(draft.driverOnline ?? ride.driverOnline ?? true) ? "border-green-500/20 bg-green-500/10 text-green-300" : "border-white/10 bg-white/5 text-white/55"}`}>
                          {(draft.driverOnline ?? ride.driverOnline ?? true) ? "Driver online" : "Driver offline"}
                        </div>
                      </div>
                    </div>

                    <div className={`rounded-full border px-4 py-3 text-[10px] font-black uppercase tracking-[0.28em] ${ride.status === "approved" ? "border-green-500/25 bg-green-500/10 text-green-300" : "border-yellow-500/25 bg-yellow-500/10 text-yellow-300"}`}>
                      {ride.status}
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_1fr_170px_170px_220px]">
                        <Field icon={<MapPin size={16} />} label="Current Driver Location">
                          <input
                            value={draft.routeFrom || ""}
                            onChange={(e) => setDraft(ride._id, { routeFrom: e.target.value, fromCoords: null })}
                        placeholder="Guptakashi"
                        className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none placeholder:text-white/24"
                      />
                      <button
                        type="button"
                        onClick={() => captureLiveLocation(ride._id)}
                        disabled={locatingId === ride._id}
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-orange-200 transition-all hover:bg-orange-500/20 disabled:opacity-60"
                      >
                        {locatingId === ride._id ? <Loader2 size={12} className="animate-spin" /> : <Crosshair size={12} />}
                        Use My Live Location
                      </button>
                    </Field>
                    <Field icon={<Navigation size={16} />} label="Next Destination">
                      <input
                        value={draft.routeTo || ""}
                        onChange={(e) => setDraft(ride._id, { routeTo: e.target.value, toCoords: null })}
                        placeholder="Dehradun"
                        className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none placeholder:text-white/24"
                      />
                    </Field>
                    <Field icon={<Users size={16} />} label="Seats To Publish">
                      <input
                        type="number"
                        min="1"
                        value={draft.seatsAvailable ?? ride.seatsAvailable}
                        onChange={(e) => setDraft(ride._id, { seatsAvailable: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none"
                      />
                    </Field>
                    <Field icon={<IndianRupee size={16} />} label="Fare Per Seat">
                      <input
                        type="number"
                        min="1"
                        value={draft.pricePerSeat ?? ride.pricePerSeat}
                        onChange={(e) => setDraft(ride._id, { pricePerSeat: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none"
                      />
                    </Field>
                    <Field icon={<Calendar size={16} />} label="Ride Date">
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={draft.availableDate || ""}
                        onChange={(e) => setDraft(ride._id, { availableDate: e.target.value })}
                        className="w-full bg-transparent text-sm font-black uppercase tracking-[0.18em] text-white outline-none [color-scheme:dark]"
                      />
                    </Field>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {hubs.map((hub) => (
                      <button
                        key={`${ride._id}-${hub}`}
                        type="button"
                        onClick={() => setDraft(ride._id, { routeFrom: hub })}
                        className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] transition-all ${draft.routeFrom === hub ? "border-orange-500/30 bg-orange-500/15 text-orange-200" : "border-white/10 bg-white/5 text-white/50 hover:text-white"}`}
                      >
                        {hub}
                      </button>
                    ))}
                  </div>

                  <details className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-5">
                    <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">
                      Complete Optional Details (Pricing/Documents/Images)
                    </summary>

                    <div className="mt-5 space-y-5">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Field icon={<Car size={16} />} label="Vehicle Model">
                          <input
                            value={draft.vehicleModel || ""}
                            onChange={(e) => setDraft(ride._id, { vehicleModel: e.target.value })}
                            className="w-full bg-transparent text-sm font-black uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/24"
                            placeholder="Innova / Sedan"
                          />
                        </Field>
                        <Field icon={<Car size={16} />} label="Plate Number">
                          <input
                            value={draft.plateNumber || ""}
                            onChange={(e) => setDraft(ride._id, { plateNumber: normalizeVehiclePlate(e.target.value) })}
                            className="w-full bg-transparent text-sm font-black uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/24"
                            placeholder="UK07 XX 1234"
                          />
                        </Field>
                        <Field icon={<Users size={16} />} label="Driver Name">
                          <input
                            value={draft.driverName || ""}
                            onChange={(e) => setDraft(ride._id, { driverName: e.target.value })}
                            className="w-full bg-transparent text-sm font-black uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/24"
                            placeholder="Driver name"
                          />
                        </Field>
                        <Field icon={<Users size={16} />} label="Contact Number">
                          <input
                            value={draft.contactNumber || ""}
                            onChange={(e) => setDraft(ride._id, { contactNumber: normalizePhone(e.target.value) })}
                            className="w-full bg-transparent text-sm font-black uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/24"
                            placeholder="9876543210"
                          />
                        </Field>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {complianceFields.map(([key, label]) => (
                          <Field key={`${ride._id}-${key}`} icon={<Navigation size={16} />} label={label}>
                            <input
                              value={draft[key] || ""}
                              onChange={(e) =>
                                setDraft(ride._id, {
                                  [key]:
                                    key === "driverAadhaarNumber"
                                      ? digitsOnly(e.target.value).slice(0, 12)
                                      : key === "driverPanNumber"
                                        ? normalizePan(e.target.value)
                                        : e.target.value,
                                })
                              }
                              className="w-full bg-transparent text-sm font-black uppercase tracking-[0.12em] text-white outline-none placeholder:text-white/24"
                              placeholder={label}
                            />
                          </Field>
                        ))}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.26em] text-white/45">Add Ride Images</p>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => onNewImagesPicked(ride._id, e.target.files)}
                            className="mt-3 block w-full text-xs text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-orange-500/20 file:px-4 file:py-2 file:text-[10px] file:font-black file:uppercase file:tracking-[0.2em] file:text-orange-200"
                          />
                          {(draft.newImages || []).length > 0 ? (
                            <p className="mt-2 text-xs text-orange-200">{(draft.newImages || []).length} new image(s) selected</p>
                          ) : null}
                        </div>

                        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.26em] text-white/45">Upload Verification Documents</p>
                          <div className="mt-3 grid gap-3">
                            {documentFields.map(([key, label]) => (
                              <label key={`${ride._id}-${key}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/75">
                                <span>{label}</span>
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  onChange={(e) => onDocumentPicked(ride._id, key, e.target.files?.[0] || null)}
                                  className="max-w-[180px] text-[10px] file:mr-2 file:rounded-full file:border-0 file:bg-orange-500/20 file:px-3 file:py-1 file:font-black file:uppercase file:tracking-[0.16em] file:text-orange-200"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => saveOptionalDetails(ride)}
                          disabled={savingId === `optional-${ride._id}`}
                          className="inline-flex items-center justify-center gap-3 rounded-[20px] border border-orange-500/30 bg-orange-500/15 px-6 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-orange-200 transition-all hover:bg-orange-500/25 disabled:opacity-60"
                        >
                          {savingId === `optional-${ride._id}` ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                          Save Optional Details
                        </button>
                      </div>
                    </div>
                  </details>

                  <div className="mt-8 flex flex-col gap-4 border-t border-white/8 pt-6 md:flex-row md:items-center md:justify-between">
                    <div className="rounded-[24px] border border-orange-500/15 bg-orange-500/[0.05] px-5 py-4 text-sm leading-7 text-white/58">
                      Use this to relaunch the same car from today’s arrival point tomorrow morning. The map route will update with the new source and destination.
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row">
                      <button
                        type="button"
                        onClick={() => toggleDriverOnline(ride)}
                        disabled={togglingId === ride._id}
                        className={`inline-flex items-center justify-center gap-3 rounded-[24px] border px-6 py-5 text-[11px] font-black uppercase tracking-[0.28em] transition-all disabled:opacity-60 ${(draft.driverOnline ?? ride.driverOnline ?? true) ? "border-green-500/25 bg-green-500/10 text-green-300 hover:bg-green-500/20" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                      >
                        {togglingId === ride._id ? <Loader2 size={16} className="animate-spin" /> : (draft.driverOnline ?? ride.driverOnline ?? true) ? "Go Offline" : "Go Online"}
                      </button>
                      <button
                        type="button"
                        onClick={() => republishRide(ride)}
                        disabled={savingId === `route-${ride._id}`}
                        className="inline-flex items-center justify-center gap-3 rounded-[24px] bg-gradient-to-r from-orange-600 to-amber-500 px-8 py-5 text-[11px] font-black uppercase tracking-[0.28em] text-white shadow-[0_20px_60px_rgba(249,115,22,0.25)] transition-all hover:brightness-110 disabled:opacity-60"
                      >
                        {savingId === `route-${ride._id}` ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Update Live Ride</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 px-5 py-4">
      <div className="mb-3 flex items-center gap-3 text-orange-300">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.32em] text-white/38">{label}</span>
      </div>
      {children}
    </div>
  );
}
