import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Ban, BookOpen, Building2, Car, CheckCircle2, ChevronLeft, ChevronRight, Crown, Database, Download, FileClock, Filter, Loader2, Menu, RefreshCw, Search, Shield, Star, Trash2, Users, WalletCards, WandSparkles } from "lucide-react";
import API from "../utils/api";
import { useNotify } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const PRESET_STORAGE_KEY = "mm_admin_console_presets_v1";
const SECTIONS = ["overview", "audit", "users", "userMeta", "hotels", "rides", "bookings", "trips", "reviews", "raw"];
const RAW_COLLECTIONS = ["users", "userMeta", "hotels", "rides", "bookings", "trips", "reviews", "audit"];
const META = { overview: { label: "Overview", icon: Shield }, audit: { label: "Audit", icon: FileClock }, users: { label: "Users", icon: Users }, userMeta: { label: "User Meta", icon: WalletCards }, hotels: { label: "Hotels", icon: Building2 }, rides: { label: "Rides", icon: Car }, bookings: { label: "Bookings", icon: BookOpen }, trips: { label: "Trips", icon: ArrowUpRight }, reviews: { label: "Reviews", icon: Star }, raw: { label: "Raw Ops", icon: Database } };
const COLS = { audit: [["createdAt", "When"], ["adminEmail", "Admin"], ["action", "Action"], ["targetType", "Target"], ["summary", "Summary"]], users: [["email", "Identity"], ["displayName", "Name"], ["role", "Role"], ["lastSignInAt", "Last Seen"]], userMeta: [["email", "Email"], ["displayName", "Display"], ["userId", "User Id"], ["updatedAt", "Updated"]], hotels: [["hotelName", "Stay"], ["location", "Location"], ["status", "Status"], ["pricePerNight", "Price"]], rides: [["vehicleType", "Ride"], ["routeFrom", "From"], ["routeTo", "To"], ["status", "Status"]], bookings: [["customerName", "Customer"], ["listingLabel", "Listing"], ["status", "Status"], ["paymentStatus", "Payment"]], trips: [["title", "Trip"], ["userId", "Owner"], ["status", "Status"], ["updatedAt", "Updated"]], reviews: [["customerName", "Reviewer"], ["hotelName", "Hotel"], ["rating", "Rating"], ["createdAt", "Created"]] };
const fmtDate = (v) => !v ? "--" : (Number.isNaN(new Date(v).getTime()) ? String(v) : new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));
const pretty = (v) => JSON.stringify(v, null, 2);
const RIDE_COMPLIANCE_FIELDS = [
  ["driverLicenseNumber", "Driver License No"],
  ["driverAadhaarNumber", "Driver Aadhaar No"],
  ["driverPanNumber", "Driver PAN No"],
  ["rcNumber", "RC Number"],
  ["insurancePolicyNumber", "Insurance Policy No"],
  ["permitNumber", "Permit Number"],
  ["pollutionCertificateNumber", "PUC Number"],
  ["fitnessCertificateNumber", "Fitness Certificate No"],
];
const RIDE_DOC_FIELDS = [
  ["driverPhoto", "Driver Photo"],
  ["driverLicenseDoc", "Driver License Scan"],
  ["driverAadhaarDoc", "Driver Aadhaar Scan"],
  ["vehicleRcDoc", "Vehicle RC"],
  ["vehicleInsuranceDoc", "Vehicle Insurance"],
  ["vehiclePermitDoc", "Tourist/Commercial Permit"],
  ["pollutionCertificateDoc", "PUC Certificate"],
  ["fitnessCertificateDoc", "Fitness Certificate"],
];
const HOTEL_COMPLIANCE_FIELDS = [
  ["ownerAadhaarNumber", "Owner Aadhaar No"],
  ["ownerPanNumber", "Owner PAN No"],
  ["gstNumber", "GST Number"],
  ["registrationNumber", "Registration Number"],
  ["tradeLicenseNumber", "Trade License Number"],
  ["fireSafetyCertificateNumber", "Fire Safety Certificate No"],
  ["bankAccountHolder", "Bank Account Holder"],
  ["bankAccountNumber", "Bank Account Number"],
  ["ifscCode", "IFSC Code"],
];
const HOTEL_DOC_FIELDS = [
  ["ownerPhoto", "Owner Photo"],
  ["ownerAadhaarDoc", "Owner Aadhaar Scan"],
  ["ownerPanDoc", "Owner PAN Scan"],
  ["propertyRegistrationDoc", "Property Registration / Lease"],
  ["tradeLicenseDoc", "Trade License"],
  ["gstCertificateDoc", "GST Certificate"],
  ["fireSafetyDoc", "Fire Safety Certificate"],
];

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return true;
  return Boolean(String(value ?? "").trim());
}

function StatusPill({ value }) {
  const v = String(value || "pending").toLowerCase();
  const cls = v === "approved"
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
    : v === "rejected" || v === "cancelled"
      ? "border-red-500/40 bg-red-500/10 text-red-300"
      : "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${cls}`}>{v}</span>;
}

function StatCard({ title, value, sublabel, accent }) {
  return <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"><div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-60`} /><div className="relative space-y-3"><p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35">{title}</p><div className="flex items-end justify-between gap-3"><p className="text-4xl font-black italic tracking-tight text-white">{value}</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{sublabel}</p></div></div></div>;
}

function RideDetailsPanel({ selected, patchSelected }) {
  const rideImages = Array.isArray(selected?.images) ? selected.images.filter(Boolean) : [];
  const compliance = selected?.complianceDetails || {};
  const docs = selected?.verificationDocuments || {};
  const setField = (key, value) => patchSelected?.({ [key]: value });
  const setCompliance = (key, value) => patchSelected?.({
    complianceDetails: { ...compliance, [key]: value },
  });
  const setDoc = (key, value) => patchSelected?.({
    verificationDocuments: { ...docs, [key]: value },
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-black/25 p-4 text-sm text-white/80">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Driver</p>
          <p className="mt-3"><span className="text-white/45">Name:</span> {selected.driverName || "--"}</p>
          <p className="mt-1"><span className="text-white/45">Phone:</span> {selected.contactNumber || "--"}</p>
          <p className="mt-1"><span className="text-white/45">Owner ID:</span> {selected.owner || "--"}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-black/25 p-4 text-sm text-white/80">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Ride</p>
          <p className="mt-3"><span className="text-white/45">Vehicle:</span> {selected.vehicleModel || "--"} ({selected.vehicleType || "--"})</p>
          <p className="mt-1"><span className="text-white/45">Plate:</span> {selected.plateNumber || "--"}</p>
          <p className="mt-1"><span className="text-white/45">Route:</span> {selected.routeFrom || "--"} to {selected.routeTo || "--"}</p>
          <p className="mt-1"><span className="text-white/45">Date:</span> {fmtDate(selected.availableDate)}</p>
          <p className="mt-1"><span className="text-white/45">Price/Seat:</span> {selected.pricePerSeat ?? "--"} | <span className="text-white/45">Seats:</span> {selected.seatsAvailable ?? "--"}</p>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Editable Ride Fields</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Driver Name<input value={selected.driverName || ""} onChange={(e) => setField("driverName", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Phone<input value={selected.contactNumber || ""} onChange={(e) => setField("contactNumber", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Vehicle Model<input value={selected.vehicleModel || ""} onChange={(e) => setField("vehicleModel", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Vehicle Type<input value={selected.vehicleType || ""} onChange={(e) => setField("vehicleType", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Plate Number<input value={selected.plateNumber || ""} onChange={(e) => setField("plateNumber", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Travel Date<input type="date" value={selected.availableDate ? String(selected.availableDate).split("T")[0] : ""} onChange={(e) => setField("availableDate", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Route From<input value={selected.routeFrom || ""} onChange={(e) => setField("routeFrom", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Route To<input value={selected.routeTo || ""} onChange={(e) => setField("routeTo", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Price / Seat<input type="number" value={selected.pricePerSeat || 0} onChange={(e) => setField("pricePerSeat", Number(e.target.value) || 0)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Seats<input type="number" value={selected.seatsAvailable || 0} onChange={(e) => setField("seatsAvailable", Number(e.target.value) || 0)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Compliance Details (Filled vs Missing)</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {RIDE_COMPLIANCE_FIELDS.map(([key, label]) => {
            const ok = hasValue(compliance[key]);
            return (
              <div key={key} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs">
                <span className="text-white/75">{label}</span>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
                  {ok ? "Added" : "Missing"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {RIDE_COMPLIANCE_FIELDS.map(([key, label]) => (
            <label key={`edit-${key}`} className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              {label}
              <input value={compliance[key] || ""} onChange={(e) => setCompliance(key, e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Verification Documents</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {RIDE_DOC_FIELDS.map(([key, label]) => {
            const url = docs[key];
            const ok = hasValue(url);
            return (
              <div key={key} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-white/80">{label}</span>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
                    {ok ? "Uploaded" : "Missing"}
                  </span>
                </div>
                {ok ? <a href={url} target="_blank" rel="noreferrer" className="text-xs text-orange-300 underline">Open file</a> : null}
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {RIDE_DOC_FIELDS.map(([key, label]) => (
            <label key={`doc-edit-${key}`} className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              {label} URL
              <input value={docs[key] || ""} onChange={(e) => setDoc(key, e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Ride Images</p>
        {rideImages.length === 0 ? (
          <p className="mt-3 text-sm text-white/45">No ride images uploaded.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {rideImages.map((src, idx) => (
              <a key={`${src}-${idx}`} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-white/10">
                <img src={src} alt={`ride-${idx}`} className="h-24 w-full object-cover" />
              </a>
            ))}
          </div>
        )}
        <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
          Image URLs (one per line)
          <textarea value={rideImages.join("\n")} onChange={(e) => patchSelected?.({ images: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none" />
        </label>
      </div>
    </div>
  );
}

function HotelDetailsPanel({ selected, patchSelected }) {
  const hotelImages = Array.isArray(selected?.images) ? selected.images.filter(Boolean) : [];
  const compliance = selected?.complianceDetails || selected?.compliance_details || {};
  const docs = selected?.verificationDocuments || selected?.verification_documents || {};

  const pick = (...vals) => vals.find((v) => hasValue(v)) ?? "";
  const pickCompliance = (camelKey, snakeKey) => pick(compliance?.[camelKey], compliance?.[snakeKey], selected?.[camelKey], selected?.[snakeKey]);
  const pickDoc = (camelKey, snakeKey) => pick(docs?.[camelKey], docs?.[snakeKey], selected?.[camelKey], selected?.[snakeKey]);
  const setField = (key, value) => patchSelected?.({ [key]: value });
  const setCompliance = (key, value) => patchSelected?.({
    complianceDetails: { ...(selected?.complianceDetails || {}), [key]: value },
    compliance_details: { ...(selected?.compliance_details || {}), [key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]: value },
  });
  const setDoc = (key, value) => patchSelected?.({
    verificationDocuments: { ...(selected?.verificationDocuments || {}), [key]: value },
    verification_documents: { ...(selected?.verification_documents || {}), [key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]: value },
  });

  const propertyType = pick(selected?.propertyType, selected?.property_type);
  const guestsPerRoom = pick(selected?.guestsPerRoom, selected?.guests_per_room);
  const availabilityStatus = pick(selected?.availabilityStatus, selected?.availability_status);
  const landmark = pick(selected?.landmark);
  const contact = pick(selected?.contactNumber, selected?.contact_number);

  const amenities = (() => {
    if (Array.isArray(selected?.amenities)) return selected.amenities;
    try {
      return JSON.parse(selected?.amenities || "[]");
    } catch {
      return [];
    }
  })();

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-black/25 p-4 text-sm text-white/80">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Property</p>
          <p className="mt-3"><span className="text-white/45">Name:</span> {selected.hotelName || "--"}</p>
          <p className="mt-1"><span className="text-white/45">Type:</span> {propertyType || "--"}</p>
          <p className="mt-1"><span className="text-white/45">Location:</span> {selected.location || "--"}</p>
          <p className="mt-1"><span className="text-white/45">Landmark:</span> {landmark || "--"}</p>
          <p className="mt-1"><span className="text-white/45">Owner ID:</span> {selected.owner || "--"}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-black/25 p-4 text-sm text-white/80">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Capacity & Pricing</p>
          <p className="mt-3"><span className="text-white/45">Price/Night:</span> Rs {selected.pricePerNight ?? "--"}</p>
          <p className="mt-1"><span className="text-white/45">Rooms:</span> {selected.roomsAvailable ?? "--"}</p>
          <p className="mt-1"><span className="text-white/45">Max Guests:</span> {guestsPerRoom || "--"}</p>
          <p className="mt-1"><span className="text-white/45">Availability:</span> {availabilityStatus || "--"}</p>
          <p className="mt-1"><span className="text-white/45">Contact:</span> {contact || "--"}</p>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Editable Hotel Fields</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Property Name<input value={selected.hotelName || ""} onChange={(e) => setField("hotelName", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Property Type<input value={propertyType || ""} onChange={(e) => setField("propertyType", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Location<input value={selected.location || ""} onChange={(e) => setField("location", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Landmark<input value={landmark || ""} onChange={(e) => setField("landmark", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Price / Night<input type="number" value={selected.pricePerNight || 0} onChange={(e) => setField("pricePerNight", Number(e.target.value) || 0)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Rooms<input type="number" value={selected.roomsAvailable || 0} onChange={(e) => setField("roomsAvailable", Number(e.target.value) || 0)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Max Guests<input type="number" value={guestsPerRoom || 0} onChange={(e) => setField("guestsPerRoom", Number(e.target.value) || 0)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Contact<input value={contact || ""} onChange={(e) => setField("contactNumber", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" /></label>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Amenities</p>
        {amenities.length === 0 ? (
          <p className="mt-3 text-sm text-white/45">No amenities listed.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {amenities.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">{item}</span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Compliance Details (Filled vs Missing)</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {HOTEL_COMPLIANCE_FIELDS.map(([key, label]) => {
            const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
            const ok = hasValue(pickCompliance(key, snakeKey));
            return (
              <div key={key} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs">
                <span className="text-white/75">{label}</span>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
                  {ok ? "Added" : "Missing"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {HOTEL_COMPLIANCE_FIELDS.map(([key, label]) => {
            const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
            return (
              <label key={`edit-${key}`} className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                {label}
                <input value={pickCompliance(key, snakeKey) || ""} onChange={(e) => setCompliance(key, e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" />
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Verification Documents</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {HOTEL_DOC_FIELDS.map(([key, label]) => {
            const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
            const url = pickDoc(key, snakeKey);
            const ok = hasValue(url);
            return (
              <div key={key} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-white/80">{label}</span>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
                    {ok ? "Uploaded" : "Missing"}
                  </span>
                </div>
                {ok ? <a href={url} target="_blank" rel="noreferrer" className="text-xs text-orange-300 underline">Open file</a> : null}
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {HOTEL_DOC_FIELDS.map(([key, label]) => (
            <label key={`doc-edit-${key}`} className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              {label} URL
              <input value={pickDoc(key, key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)) || ""} onChange={(e) => setDoc(key, e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none" />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/25 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Hotel Images</p>
        {hotelImages.length === 0 ? (
          <p className="mt-3 text-sm text-white/45">No hotel images uploaded.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {hotelImages.map((src, idx) => (
              <a key={`${src}-${idx}`} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-white/10">
                <img src={src} alt={`hotel-${idx}`} className="h-24 w-full object-cover" />
              </a>
            ))}
          </div>
        )}
        <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
          Image URLs (one per line)
          <textarea value={hotelImages.join("\n")} onChange={(e) => patchSelected?.({ images: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none" />
        </label>
      </div>
    </div>
  );
}
export default function AdminDashboard() {
  const { notify } = useNotify();
  const { user, loading: authLoading } = useAuth();
  const [section, setSection] = useState("overview");
  const [rawCollection, setRawCollection] = useState("users");
  const [overview, setOverview] = useState(null);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [rawDraft, setRawDraft] = useState("");
  const [userDraft, setUserDraft] = useState({ role: "user", displayName: "", bannedUntil: "" });
  const [confirmText, setConfirmText] = useState("");
  const [loadingSection, setLoadingSection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [presetName, setPresetName] = useState("");
  const [savedPresets, setSavedPresets] = useState({});
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const rawMode = section === "raw";
  const auditMode = section === "audit";
  const selectedId = selected?.id || selected?._id;
  const destructiveUnlocked = confirmText === "CONFIRM";
  const currentPresetKey = rawMode ? `raw:${rawCollection}` : section;
  const columns = useMemo(() => rawMode ? Object.keys(rows[0] || {}).filter((k) => k !== "__v").slice(0, 5).map((key) => ({ key, label: key })) : (COLS[section] || []).map(([key, label]) => ({ key, label })), [rows, section, rawMode]);
  const statCards = useMemo(() => {
    const t = overview?.totals;
    if (!t) return [];
    return [{ title: "Auth Users", value: t.users, sublabel: "Supabase", accent: "from-orange-500/25 to-transparent" }, { title: "User Meta", value: t.userMeta, sublabel: "profiles", accent: "from-violet-400/20 to-transparent" }, { title: "Live Stays", value: t.hotels, sublabel: `${t.pendingHotels} pending`, accent: "from-amber-400/20 to-transparent" }, { title: "Fleet", value: t.rides, sublabel: `${t.pendingRides} pending`, accent: "from-sky-400/20 to-transparent" }, { title: "Bookings", value: t.bookings, sublabel: `${t.pendingBookings} pending`, accent: "from-emerald-400/20 to-transparent" }, { title: "Audit Logs", value: t.audits, sublabel: "history", accent: "from-cyan-400/20 to-transparent" }];
  }, [overview]);
  const bulkButtons = useMemo(() => {
    if (rawMode || auditMode || selectedIds.length === 0) return [];
    if (section === "hotels") return [{ label: "Approve", action: "approve" }, { label: "Pending", action: "pending" }, { label: "Delete", action: "delete", danger: true }];
    if (section === "rides") return [{ label: "Approve", action: "approve" }, { label: "Reject", action: "reject", danger: true }, { label: "Pending", action: "pending" }, { label: "Delete", action: "delete", danger: true }];
    if (section === "bookings") return [{ label: "Confirm", action: "set-status", payload: { status: "confirmed" } }, { label: "Cancel", action: "set-status", payload: { status: "cancelled" }, danger: true }, { label: "Paid", action: "set-payment", payload: { paymentStatus: "paid" } }, { label: "Delete", action: "delete", danger: true }];
    if (section === "trips") return [{ label: "Mark Booked", action: "set-status", payload: { status: "booked" } }, { label: "Mark Draft", action: "set-status", payload: { status: "draft" } }, { label: "Delete", action: "delete", danger: true }];
    if (section === "reviews" || section === "userMeta") return [{ label: "Delete", action: "delete", danger: true }];
    return [];
  }, [section, selectedIds, rawMode, auditMode]);

  const endpoint = (kind = section, rawKind = rawCollection) => kind === "overview" ? "/admin-console/overview" : kind === "audit" ? "/admin-console/audit" : kind === "userMeta" ? "/admin-console/user-meta" : kind === "raw" ? `/admin-console/raw/${rawKind}` : `/admin-console/${kind}`;
  const actionUrl = () => rawMode ? `/admin-console/raw/${rawCollection}/${selectedId}` : section === "userMeta" ? `/admin-console/user-meta/${selectedId}` : `/admin-console/${section}/${selectedId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRESET_STORAGE_KEY);
      setSavedPresets(raw ? JSON.parse(raw) : {});
    } catch {
      setSavedPresets({});
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(savedPresets));
    } catch {
      // Ignore storage failures
    }
  }, [savedPresets]);

  useEffect(() => { setPage(1); setSelected(null); setSelectedIds([]); setRows([]); setRawDraft(""); setConfirmText(""); setStatusFilter(""); setPaymentFilter(""); setRoleFilter(""); setActionFilter(""); setTargetFilter(""); setSortDir("desc"); setSortBy(section === "users" ? "createdAt" : "updatedAt"); }, [section, rawCollection, pageSize]);
  useEffect(() => {
    if (!selected) { setRawDraft(""); setUserDraft({ role: "user", displayName: "", bannedUntil: "" }); return; }
    setRawDraft(section === "users" ? "" : pretty(selected));
    if (section === "users") setUserDraft({ role: selected.role || "user", displayName: selected.displayName || "", bannedUntil: selected.bannedUntil || "" });
  }, [selected, section]);

  const loadOverview = async () => { const res = await API.get("/admin-console/overview"); setOverview(res.data?.data || null); };
  const loadData = async (kind = section, term = query, rawKind = rawCollection, nextPage = page, nextSize = pageSize) => {
    if (kind === "overview") return loadOverview();
    setLoadingSection(true);
    try {
      const params = {
        ...(term ? { q: term } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(paymentFilter ? { paymentStatus: paymentFilter } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(targetFilter ? { targetType: targetFilter } : {}),
        ...(sortBy ? { sortBy } : {}),
        ...(sortDir ? { sortDir } : {}),
        page: nextPage,
        pageSize: nextSize
      };
      const res = await API.get(endpoint(kind, rawKind), { params });
      const data = (res.data?.data || []).map((item) => (kind === "reviews" ? { ...item, hotelName: item.hotelId?.hotelName || "Hotel" } : item));
      setRows(data);
      setPagination(res.data?.pagination || { page: nextPage, pageSize: nextSize, total: data.length, totalPages: 1 });
      setAccessDenied(false);
    } catch (err) {
      const message = err?.response?.data?.message || "";
      if ([401, 403].includes(err?.response?.status)) setAccessDenied(true);
      else if (kind === "raw" || message.includes("without Mongo") || message.includes("require Mongo")) {
        setRows([]);
        setPagination({ page: nextPage, pageSize: nextSize, total: 0, totalPages: 1 });
        setAccessDenied(false);
      } else {
        notify("Unable to load admin data.", "error");
      }
    } finally { setLoadingSection(false); }
  };
  useEffect(() => {
    if (!authLoading && user) {
      loadData(section, query, rawCollection, page, pageSize);
      if (section !== "overview") {
        loadOverview().catch(() => {
          setOverview(null);
        });
      }
    }
  }, [authLoading, user, section, query, rawCollection, page, pageSize, statusFilter, paymentFilter, roleFilter, actionFilter, targetFilter, sortBy, sortDir]);

  const refreshCurrent = async () => { await loadData(section, query, rawCollection, page, pageSize); if (section !== "overview") await loadOverview(); };
  const toggleSelectedId = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleSelectAll = () => { const ids = rows.map((row) => row.id || row._id).filter(Boolean); setSelectedIds((prev) => (prev.length === ids.length ? [] : ids)); };
  const patchSelected = (partial) => { const next = { ...selected, ...partial }; setSelected(next); setRawDraft(pretty(next)); };
  const exportSection = async (format = "json") => {
    const target = rawMode ? rawCollection : section;
    try {
      const res = await API.get(`/admin-console/export/${target}`, { params: { format }, responseType: "blob" });
      const filename = (res.headers["content-disposition"] || "").match(/filename="([^"]+)"/)?.[1] || `admin-${target}.${format}`;
      const url = window.URL.createObjectURL(new Blob([res.data])); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
      notify(`${target} exported.`, "success");
    } catch { notify("Export failed.", "error"); }
  };
  const handleSave = async () => {
    if (!selectedId || auditMode) return;
    setSaving(true);
    try {
      if (section === "users") await API.patch(`/admin-console/users/${selectedId}`, { role: userDraft.role, displayName: userDraft.displayName, bannedUntil: userDraft.bannedUntil || null });
      else await API.patch(actionUrl(), JSON.parse(rawDraft));
      notify("Admin record updated.", "success"); await refreshCurrent();
    } catch (err) { notify(err?.response?.data?.message || "Unable to save record.", "error"); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!selectedId || !destructiveUnlocked || auditMode) return;
    setDestroying(true);
    try { await API.delete(actionUrl()); notify(section === "users" ? "User terminated." : "Record deleted.", "success"); setSelected(null); setConfirmText(""); await refreshCurrent(); }
    catch (err) { notify(err?.response?.data?.message || "Unable to delete record.", "error"); }
    finally { setDestroying(false); }
  };
  const handleBulk = async (item) => {
    if (item.danger && !destructiveUnlocked) return notify("Type CONFIRM before destructive bulk actions.", "warning");
    setBulkLoading(true);
    try { await API.post("/admin-console/bulk", { section, ids: selectedIds, action: item.action, payload: item.payload || {} }); notify(`Bulk action completed for ${selectedIds.length} record(s).`, "success"); setSelectedIds([]); setSelected(null); if (item.danger) setConfirmText(""); await refreshCurrent(); }
    catch (err) { notify(err?.response?.data?.message || "Bulk action failed.", "error"); }
    finally { setBulkLoading(false); }
  };
  const resetViewControls = () => {
    setQuery("");
    setStatusFilter("");
    setPaymentFilter("");
    setRoleFilter("");
    setActionFilter("");
    setTargetFilter("");
    setSortBy(section === "users" ? "createdAt" : "updatedAt");
    setSortDir("desc");
    setPage(1);
  };
  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return notify("Enter a preset name first.", "warning");
    setSavedPresets((prev) => ({
      ...prev,
      [currentPresetKey]: {
        ...(prev[currentPresetKey] || {}),
        [name]: {
          query,
          statusFilter,
          paymentFilter,
          roleFilter,
          actionFilter,
          targetFilter,
          sortBy,
          sortDir,
          pageSize,
        },
      },
    }));
    setPresetName("");
    notify("View preset saved.", "success");
  };
  const applyPreset = (name) => {
    const preset = savedPresets[currentPresetKey]?.[name];
    if (!preset) return;
    setQuery(preset.query || "");
    setStatusFilter(preset.statusFilter || "");
    setPaymentFilter(preset.paymentFilter || "");
    setRoleFilter(preset.roleFilter || "");
    setActionFilter(preset.actionFilter || "");
    setTargetFilter(preset.targetFilter || "");
    setSortBy(preset.sortBy || (section === "users" ? "createdAt" : "updatedAt"));
    setSortDir(preset.sortDir || "desc");
    setPageSize(preset.pageSize || 20);
    setPage(1);
    notify(`Preset "${name}" applied.`, "success");
  };
  const deletePreset = (name) => {
    setSavedPresets((prev) => {
      const next = { ...(prev[currentPresetKey] || {}) };
      delete next[name];
      return { ...prev, [currentPresetKey]: next };
    });
    notify(`Preset "${name}" removed.`, "success");
  };
  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  if (authLoading) return <div className="min-h-screen bg-[#050505] pt-32"><Container className="flex min-h-[60vh] items-center justify-center"><div className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-400"><Loader2 size={16} className="mr-2 inline animate-spin" />Authorizing console</div></Container></div>;
  if (!user || accessDenied) return <div className="min-h-screen bg-[#050505] pt-32 pb-24"><Container><div className="mx-auto max-w-xl rounded-[40px] border border-white/10 bg-white/[0.03] p-12 text-center shadow-[0_30px_90px_rgba(0,0,0,0.42)]"><Crown size={34} className="mx-auto text-orange-400" /><h1 className="mt-6 text-4xl font-black uppercase italic tracking-tight text-white">Admin clearance required</h1><p className="mt-4 text-sm leading-7 text-white/50">This console unlocks only when the backend confirms your Supabase admin role.</p></div></Container></div>;

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-32 text-white">
      <Container className="space-y-8">
        <div className={`grid gap-8 ${sidebarCollapsed ? "xl:grid-cols-[96px_1fr]" : "xl:grid-cols-[280px_1fr]"}`}><button type="button" onClick={() => setMobileSidebarOpen((prev) => !prev)} className="xl:hidden inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/80"><Menu size={16} />{mobileSidebarOpen ? "Hide menu" : "Open menu"}</button>
          <div className={`space-y-6 ${mobileSidebarOpen ? "block" : "hidden"} xl:block xl:sticky xl:top-32 xl:self-start`}>
            <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/30">Admin workspace</p><button type="button" onClick={() => setSidebarCollapsed((prev) => !prev)} className="hidden xl:inline-flex items-center justify-center rounded-full border border-white/15 bg-black/30 p-2 text-white/65 hover:text-white">{sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button></div><div className="mt-5 space-y-2">{SECTIONS.map((key) => { const Icon = META[key].icon; return <button key={key} type="button" onClick={() => setSection(key)} className={`flex w-full items-center justify-between rounded-[24px] border px-4 py-4 text-left transition ${section === key ? "border-orange-500/30 bg-orange-500/10 text-white" : "border-white/6 bg-black/20 text-white/55 hover:border-white/14 hover:text-white"}`}><span className="flex items-center gap-3"><Icon size={16} className={section === key ? "text-orange-300" : "text-white/35"} /><span className={`text-[11px] font-black uppercase tracking-[0.24em] ${sidebarCollapsed ? "xl:hidden" : ""}`}>{META[key].label}</span></span><ArrowUpRight size={14} className={`text-white/25 ${sidebarCollapsed ? "xl:hidden" : ""}`} /></button>; })}</div></div>
            <div className="rounded-[34px] border border-orange-500/15 bg-gradient-to-br from-orange-500/10 to-transparent p-5"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">Phase 3 active</p><p className="mt-4 text-sm leading-7 text-white/55">Audit history, exports, typed confirmations, and page controls are now built into the admin vault.</p></div>
          </div>

          <div className="space-y-8">
            {section === "overview" ? (
              <div className="space-y-8">
                <div className="rounded-[38px] border border-orange-500/20 bg-[linear-gradient(145deg,rgba(249,115,22,0.14),rgba(255,255,255,0.02)),rgba(8,8,8,0.95)] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.42)]"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="space-y-4"><p className="text-[10px] font-black uppercase tracking-[0.45em] text-orange-300">Power Console Phase 3</p><h1 className="text-4xl font-black uppercase italic tracking-[-0.05em] text-white md:text-6xl">Safer ops and audit trail online.</h1><p className="max-w-2xl text-sm leading-7 text-white/55">Every admin mutation is now logged, exports are one click away, and destructive actions require typed confirmation.</p></div><div className="rounded-[28px] border border-white/10 bg-black/30 px-5 py-4 text-[10px] font-black uppercase tracking-[0.32em] text-white/45">Admin only surface</div></div></div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{statCards.map((card) => <StatCard key={card.title} {...card} />)}</div>
                <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"><div className="mb-6 flex items-center gap-3"><WandSparkles className="text-orange-400" size={18} /><p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Phase 3 unlocks</p></div><div className="space-y-4 text-sm leading-7 text-white/55"><p>`Audit` now shows the history of admin updates, deletes, bulk actions, and exports.</p><p>All list views support pagination and export downloads.</p><p>Users now include activity summaries for partner-owned stays, rides, bookings, and trips.</p></div></div>
              </div>
            ) : (
              <div className="grid gap-8 2xl:grid-cols-[1.12fr_0.88fr]">
                <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                  <div className="border-b border-white/10 px-6 py-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><Filter size={14} className="text-orange-300" /><p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/30">{META[section].label}</p></div><h2 className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white">Live control surface</h2></div><div className="flex flex-wrap gap-3">{rawMode && <select value={rawCollection} onChange={(e) => setRawCollection(e.target.value)} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none">{RAW_COLLECTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select>}<Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={`Search ${rawMode ? rawCollection : META[section].label.toLowerCase()}...`} leftIcon={Search} className="min-w-[220px]" />{section === "users" && <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none"><option value="">All Roles</option><option value="admin">admin</option><option value="user">user</option></select>}{["hotels","rides","trips"].includes(section) && <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none"><option value="">All Status</option><option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option><option value="draft">draft</option><option value="booked">booked</option></select>}{section === "bookings" && <><select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none"><option value="">All Booking Status</option><option value="pending">pending</option><option value="confirmed">confirmed</option><option value="completed">completed</option><option value="cancelled">cancelled</option></select><select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none"><option value="">All Payment</option><option value="pending">pending</option><option value="paid">paid</option><option value="failed">failed</option></select></>}{section === "audit" && <><select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none"><option value="">All Actions</option><option value="update">update</option><option value="delete">delete</option><option value="bulk">bulk</option><option value="export">export</option><option value="terminate">terminate</option></select><Input value={targetFilter} onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }} placeholder="Target type" className="min-w-[140px]" /></>}<select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none">{[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}</select><Button variant="ghost" size="md" onClick={refreshCurrent} className="min-w-[52px] px-4 sm:px-5"><RefreshCw size={16} /><span className="hidden xl:inline">Refresh</span></Button><Button variant="ghost" size="md" onClick={resetViewControls}>Reset</Button>{!auditMode && <Button variant="ghost" size="md" onClick={() => exportSection("json")}><Download size={16} /> JSON</Button>}{!auditMode && <Button variant="ghost" size="md" onClick={() => exportSection("csv")}><Download size={16} /> CSV</Button>}</div></div><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><Input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Save current view as..." className="min-w-[220px]" /><Button variant="ghost" size="sm" onClick={savePreset}>Save Preset</Button><div className="flex flex-wrap gap-2">{Object.keys(savedPresets[currentPresetKey] || {}).map((name) => <div key={name} className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-1"><button type="button" onClick={() => applyPreset(name)} className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">{name}</button><button type="button" onClick={() => deletePreset(name)} className="text-[10px] text-red-400">x</button></div>)}</div></div></div>
                  {bulkButtons.length > 0 && <div className="border-b border-white/10 px-6 py-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-center gap-4"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">{selectedIds.length} selected</p><Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type CONFIRM for deletes" className="min-w-[220px]" /></div><div className="flex flex-wrap gap-3">{bulkButtons.map((item) => <Button key={`${item.label}-${item.action}`} size="sm" variant={item.danger ? "danger" : "ghost"} onClick={() => handleBulk(item)} disabled={bulkLoading || (item.danger && !destructiveUnlocked)}>{bulkLoading ? <Loader2 size={14} className="animate-spin" /> : item.danger ? <Trash2 size={14} /> : <CheckCircle2 size={14} />}{item.label}</Button>)}</div></div></div>}
                  <div className="overflow-x-auto"><table className="min-w-full text-left"><thead><tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.28em] text-white/30">{bulkButtons.length > 0 && !rawMode && <th className="px-4 py-4"><input type="checkbox" checked={rows.length > 0 && selectedIds.length === rows.length} onChange={toggleSelectAll} /></th>}{columns.map((c) => <th key={c.key} className="px-6 py-4"><button type="button" onClick={() => toggleSort(c.key)} className="flex items-center gap-2">{c.label}{sortBy === c.key ? <span className="text-orange-300">{sortDir === "asc" ? "↑" : "↓"}</span> : null}</button></th>)}</tr></thead><tbody>{loadingSection ? <tr><td colSpan={columns.length + (bulkButtons.length > 0 && !rawMode ? 1 : 0)} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-[0.35em] text-white/35"><Loader2 size={16} className="mr-2 inline animate-spin" />Loading stream</td></tr> : rows.length === 0 ? <tr><td colSpan={columns.length + (bulkButtons.length > 0 && !rawMode ? 1 : 0)} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-[0.35em] text-white/35">No records found</td></tr> : rows.map((row) => { const id = row.id || row._id; return <tr key={id} className={`cursor-pointer border-b border-white/6 transition hover:bg-white/[0.04] ${selectedId === id ? "bg-orange-500/8" : ""}`} onClick={() => setSelected(row)}>{bulkButtons.length > 0 && !rawMode && <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelectedId(id)} /></td>}{columns.map((c) => <td key={c.key} className="px-6 py-4 align-top text-sm text-white/80">{["createdAt", "updatedAt", "lastSignInAt"].includes(c.key) ? fmtDate(row[c.key]) : c.key === "status" ? <StatusPill value={row[c.key]} /> : c.key === "pricePerNight" ? `Rs ${row[c.key] ?? 0}` : typeof row[c.key] === "object" && row[c.key] !== null ? pretty(row[c.key]).slice(0, 80) : row[c.key] ?? "--"}</td>)}</tr>; })}</tbody></table></div>
                  <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-white/35"><span>Page {pagination.page} / {pagination.totalPages} • {pagination.total} records</span><div className="flex gap-3"><Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={pagination.page <= 1}>Prev</Button><Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages || 1))} disabled={pagination.page >= pagination.totalPages}>Next</Button></div></div>
                </div>

                <div className="2xl:sticky 2xl:top-32 2xl:self-start">
                  {!selected ? <div className="rounded-[34px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-white/35"><Database size={28} className="mx-auto mb-4 text-orange-400/70" /><p className="text-[10px] font-black uppercase tracking-[0.32em]">Select a record</p><p className="mt-4 text-sm leading-7">Pick any row to inspect raw data, edit fields, review audit history, or take an action.</p></div> : <div className="rounded-[34px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">{rawMode ? `${rawCollection} detail` : `${META[section].label} detail`}</p><h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-white">{selected.displayName || selected.email || selected.hotelName || selected.vehicleType || selected.customerName || selected.title || selected.action || "Record"}</h3></div><div className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{selected.status || selected.role || selected.targetType || "live"}</div></div>{section === "users" ? <div className="space-y-5"><div className="rounded-[26px] border border-white/8 bg-black/20 p-5"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Identity</p><p className="mt-3 text-sm text-white/80">{selected.email}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{selected.id}</p><div className="mt-4 grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/45"><div>Hotels: {selected.activity?.hotels || 0}</div><div>Rides: {selected.activity?.rides || 0}</div><div>Bookings: {selected.activity?.bookings || 0}</div><div>Trips: {selected.activity?.trips || 0}</div></div></div><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Display name<input value={userDraft.displayName} onChange={(e) => setUserDraft((p) => ({ ...p, displayName: e.target.value }))} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none focus:border-orange-500/50" /></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Role<select value={userDraft.role} onChange={(e) => setUserDraft((p) => ({ ...p, role: e.target.value }))} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase text-white outline-none"><option value="user">user</option><option value="admin">admin</option></select></label><div className="rounded-[26px] border border-white/8 bg-black/20 p-5 text-sm text-white/55"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Auth metadata</p><pre className="mt-4 overflow-auto whitespace-pre-wrap break-all text-[12px] leading-6 text-white/55">{pretty(selected.authUser || {})}</pre></div></div> : section === "hotels" ? <div className="space-y-5"><HotelDetailsPanel selected={selected} patchSelected={patchSelected} /><div className="grid gap-4 md:grid-cols-2"><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Hotel name<input value={selected.hotelName || ""} onChange={(e) => patchSelected({ hotelName: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Location<input value={selected.location || ""} onChange={(e) => patchSelected({ location: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Price per night<input value={selected.pricePerNight || 0} onChange={(e) => patchSelected({ pricePerNight: Number(e.target.value) || 0 })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Rooms<input value={selected.roomsAvailable || 0} onChange={(e) => patchSelected({ roomsAvailable: Number(e.target.value) || 0 })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label></div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => patchSelected({ status: "approved", isVerified: true })} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300 transition hover:-translate-y-0.5 hover:bg-emerald-500/25"><CheckCircle2 size={14} />Approve</button><button type="button" onClick={() => patchSelected({ status: "pending", isVerified: false })} className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300 transition hover:-translate-y-0.5 hover:bg-amber-500/25"><RefreshCw size={14} />Pending</button><button type="button" onClick={() => patchSelected({ status: "rejected", isVerified: false })} className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/25"><Ban size={14} />Reject</button></div><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Description<textarea value={selected.description || ""} onChange={(e) => patchSelected({ description: e.target.value })} rows={5} className="mt-3 w-full rounded-[26px] border border-white/10 bg-black/30 px-5 py-4 text-[12px] leading-6 text-white outline-none" /></label><details className="rounded-[20px] border border-white/10 bg-black/20 p-4"><summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Advanced JSON</summary><textarea value={rawDraft || pretty(selected)} onChange={(e) => setRawDraft(e.target.value)} rows={10} className="mt-3 w-full rounded-[20px] border border-white/10 bg-black/30 px-4 py-3 text-[12px] leading-6 text-white outline-none" /></details></div> : section === "userMeta" ? <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Display name<input value={selected.displayName || ""} onChange={(e) => patchSelected({ displayName: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Email<input value={selected.email || ""} onChange={(e) => patchSelected({ email: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label></div><div className="grid gap-4 md:grid-cols-2"><div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/70">Wishlist items: {selected.wishlistCount ?? selected.wishlist?.length ?? 0}</div><div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/70">Referral invites: {selected.inviteCount ?? selected.referral?.invitedUsers?.length ?? 0}</div></div><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Referral code<input value={selected.referral?.code || ""} onChange={(e) => patchSelected({ referral: { ...(selected.referral || {}), code: e.target.value } })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white outline-none" /></label><details className="rounded-[20px] border border-white/10 bg-black/20 p-4"><summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Advanced JSON</summary><textarea value={rawDraft || pretty(selected)} onChange={(e) => setRawDraft(e.target.value)} rows={10} className="mt-3 w-full rounded-[20px] border border-white/10 bg-black/30 px-4 py-3 text-[12px] leading-6 text-white outline-none" /></details></div> : <div className="space-y-5">{(section === "rides") && !rawMode && <div className="flex flex-wrap gap-3"><button type="button" onClick={() => patchSelected({ status: "approved", isVerified: true })} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300 transition hover:-translate-y-0.5 hover:bg-emerald-500/25"><CheckCircle2 size={14} />Approve</button><button type="button" onClick={() => patchSelected({ status: "pending", isVerified: false })} className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300 transition hover:-translate-y-0.5 hover:bg-amber-500/25"><RefreshCw size={14} />Pending</button><button type="button" onClick={() => patchSelected({ status: "rejected", isVerified: false })} className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/25"><Ban size={14} />Reject</button></div>}{(section === "rides") && !rawMode && <RideDetailsPanel selected={selected} patchSelected={patchSelected} />}{section === "bookings" && !rawMode && <div className="grid gap-4 md:grid-cols-2"><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Booking status<select value={selected.status || "pending"} onChange={(e) => patchSelected({ status: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase text-white outline-none">{["pending", "confirmed", "completed", "cancelled"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Payment status<select value={selected.paymentStatus || "pending"} onChange={(e) => patchSelected({ paymentStatus: e.target.value })} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase text-white outline-none">{["pending", "paid", "failed"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>}<label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Raw editor<textarea value={rawDraft || pretty(selected)} onChange={(e) => setRawDraft(e.target.value)} rows={18} disabled={auditMode} className="mt-3 w-full rounded-[26px] border border-white/10 bg-black/30 px-5 py-4 text-[12px] leading-6 text-white outline-none focus:border-orange-500/50 disabled:opacity-70" /></label></div>}{!auditMode && <div className="mt-6 space-y-4"><Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type CONFIRM before destructive action" /><div className="flex flex-wrap gap-3"><Button onClick={handleSave} disabled={saving} size="md">{saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}Save changes</Button><Button variant="danger" size="md" onClick={handleDelete} disabled={destroying || !destructiveUnlocked}>{destroying ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{section === "users" ? "Terminate user" : "Delete record"}</Button></div></div>}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}




















