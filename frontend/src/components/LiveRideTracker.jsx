import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from "react-leaflet";
import { Calendar, Clock3, Loader2, MapPin, Navigation, Route, ShieldCheck, X } from "lucide-react";
import API from "../utils/api";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotificationContext";
import { Button } from "./ui/Button";

const ease = [0.22, 1, 0.36, 1];

const STATUS_LABELS = {
  searching: "Searching",
  accepted: "Accepted",
  on_the_way: "On the way",
  completed: "Completed",
  declined: "Declined",
};

const toRad = (value) => (value * Math.PI) / 180;

const getDistanceKm = (pointA, pointB) => {
  if (!pointA?.lat || !pointA?.lng || !pointB?.lat || !pointB?.lng) return null;
  const earthKm = 6371;
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);
  const lat1 = toRad(pointA.lat);
  const lat2 = toRad(pointB.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthKm * c;
};

export default function LiveRideTracker({ bookingId, initialBooking, initialViewerRole = "rider", open, onClose }) {
  const { user } = useAuth();
  const { notify } = useNotify();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [locationState, setLocationState] = useState("Waiting for GPS");
  const [updatingStatus, setUpdatingStatus] = useState("");
  const watchIdRef = useRef(null);
  const lastEmitRef = useRef(0);
  const nearAlertRef = useRef(false);

  const actorId = String(user?.id || user?._id || "");
  const viewerRole = booking?.viewerRole || initialViewerRole || "rider";
  const driverLocation = booking?.liveTracking?.driverLocation || null;
  const riderLocation = booking?.liveTracking?.riderLocation || null;
  const trackingStatus = booking?.liveTracking?.status || "searching";

  useEffect(() => {
    if (!open || !bookingId) return;

    setBooking((prev) =>
      prev && String(prev._id) === String(bookingId)
        ? prev
        : initialBooking
          ? { ...initialBooking, viewerRole: initialViewerRole }
          : null
    );

    let cancelled = false;
    const loadTracking = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/booking/tracking/${bookingId}`);
        if (!cancelled) {
          setBooking(res.data?.data || null);
        }
      } catch {
        if (!cancelled) {
          setGeoError("Live tracker opened with local booking data. Backend sync for this booking is unavailable right now.");
          setLocationState("Limited sync mode");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTracking();
    return () => {
      cancelled = true;
    };
  }, [bookingId, initialBooking, initialViewerRole, open]);

  useEffect(() => {
    if (!open || !bookingId || !actorId || !booking?.bookingType) return;

    socket.emit("join:booking", { bookingId, userId: actorId });

    const handleSnapshot = (payload) => {
      if (String(payload?.bookingId) !== String(bookingId)) return;
      setBooking((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          liveTracking: {
            ...(prev.liveTracking || {}),
            ...(payload.liveTracking || {}),
          },
        };
      });
    };

    const handleTrackingUpdate = (payload) => {
      if (String(payload?.bookingId) !== String(bookingId)) return;
      setBooking((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          liveTracking: {
            ...(prev.liveTracking || {}),
            [payload.role === "driver" ? "driverLocation" : "riderLocation"]: payload.location,
          },
        };
      });
    };

    const handleStatusUpdate = (payload) => {
      if (String(payload?.bookingId) !== String(bookingId)) return;
      setBooking((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          liveTracking: {
            ...(prev.liveTracking || {}),
            status: payload.status || prev.liveTracking?.status,
          },
        };
      });
    };

    socket.on("tracking:snapshot", handleSnapshot);
    socket.on("tracking:update", handleTrackingUpdate);
    socket.on("tracking:status", handleStatusUpdate);

    return () => {
      socket.off("tracking:snapshot", handleSnapshot);
      socket.off("tracking:update", handleTrackingUpdate);
      socket.off("tracking:status", handleStatusUpdate);
    };
  }, [actorId, booking?.bookingType, bookingId, open]);

  useEffect(() => {
    if (!open || !bookingId || !actorId || booking?.bookingType !== "Transport") return;
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported on this device.");
      return;
    }

    setGeoError("");
    setLocationState("Connecting to GPS");

    const eventName = viewerRole === "driver" ? "driver-location-update" : "user-location-update";

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastEmitRef.current < 3000) return;
        lastEmitRef.current = now;

        const payload = {
          bookingId,
          userId: actorId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy,
        };

        socket.emit(eventName, payload);
        setLocationState("Live location sharing active");
        setBooking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            liveTracking: {
              ...(prev.liveTracking || {}),
              [viewerRole === "driver" ? "driverLocation" : "riderLocation"]: {
                ...payload,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },
      (error) => {
        setGeoError(error.message || "Location permission denied.");
        setLocationState("Location access blocked");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [actorId, booking?.bookingType, bookingId, open, viewerRole]);

  const routePoints = useMemo(() => {
    const points = [];
    if (riderLocation?.lat && riderLocation?.lng) points.push([riderLocation.lat, riderLocation.lng]);
    if (driverLocation?.lat && driverLocation?.lng) points.push([driverLocation.lat, driverLocation.lng]);
    return points;
  }, [driverLocation, riderLocation]);

  const distanceKm = useMemo(() => getDistanceKm(driverLocation, riderLocation), [driverLocation, riderLocation]);
  const etaMinutes = useMemo(() => {
    if (!distanceKm) return null;
    const liveSpeedKmh = Number(driverLocation?.speed || 0) * 3.6;
    const travelSpeed = liveSpeedKmh > 8 ? liveSpeedKmh : 32;
    return Math.max(1, Math.round((distanceKm / travelSpeed) * 60));
  }, [distanceKm, driverLocation?.speed]);

  useEffect(() => {
    if (!distanceKm) {
      nearAlertRef.current = false;
      return;
    }
    if (distanceKm <= 1 && !nearAlertRef.current) {
      nearAlertRef.current = true;
      notify(viewerRole === "driver" ? "Rider is near your pickup point." : "Driver is near your pickup point.", "success");
    }
    if (distanceKm > 1.2) {
      nearAlertRef.current = false;
    }
  }, [distanceKm, notify, viewerRole]);

  const handleStatusChange = async (status) => {
    setUpdatingStatus(status);
    try {
      const res = await API.patch(`/booking/tracking/${bookingId}/status`, { status });
      const updated = res.data?.data;
      if (updated) {
        setBooking((prev) => ({
          ...(prev || {}),
          ...updated,
          viewerRole: prev?.viewerRole || "driver",
        }));
      }
      notify("Ride status updated.", "success");
    } catch {
      notify("Unable to update ride status right now.", "error");
    } finally {
      setUpdatingStatus("");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10120] p-4 md:p-8"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-black/88 backdrop-blur-2xl"
            aria-label="Close live ride tracker"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={{ duration: 0.35, ease }}
            className="relative mx-auto flex h-full max-h-[92vh] w-full max-w-[1320px] overflow-hidden rounded-[38px] border border-white/10 bg-[#060606] shadow-[0_40px_120px_rgba(0,0,0,0.52)] lg:grid lg:grid-cols-[1.15fr_0.85fr]"
          >
            <div className="relative min-h-[360px] border-b border-white/8 lg:border-b-0 lg:border-r">
              {loading ? (
                <div className="flex h-full items-center justify-center text-white/55">
                  <Loader2 className="animate-spin text-orange-400" size={34} />
                </div>
              ) : (
                <MapContainer
                  center={[30.3165, 78.0322]}
                  zoom={10}
                  className="h-full w-full"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {riderLocation?.lat && riderLocation?.lng ? (
                    <CircleMarker center={[riderLocation.lat, riderLocation.lng]} radius={12} pathOptions={{ color: "#f97316", fillColor: "#fdba74", fillOpacity: 0.95 }}>
                    </CircleMarker>
                  ) : null}
                  {driverLocation?.lat && driverLocation?.lng ? (
                    <CircleMarker center={[driverLocation.lat, driverLocation.lng]} radius={12} pathOptions={{ color: "#22c55e", fillColor: "#86efac", fillOpacity: 0.95 }}>
                    </CircleMarker>
                  ) : null}
                  {routePoints.length === 2 ? (
                    <Polyline positions={routePoints} pathOptions={{ color: "#f97316", weight: 4, opacity: 0.8, dashArray: "10 8" }} />
                  ) : null}
                  <FitLiveBounds points={routePoints} />
                </MapContainer>
              )}

              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5">
                <div className="rounded-full border border-white/12 bg-black/35 px-4 py-2 backdrop-blur-xl">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                    <Navigation size={12} className="text-orange-300" />
                    Live tracking
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white transition-colors hover:bg-red-500"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="no-scrollbar overflow-y-auto p-6 md:p-8 lg:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.42em] text-orange-300">Ride Telemetry</p>
              <h2 className="mt-4 text-4xl font-black uppercase italic tracking-[-0.05em] text-white">
                {booking?.listingLabel || "Live ride"}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/58">
                Driver and rider locations update live as long as both sides allow GPS access in the browser.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <SignalCard title="Trip status" value={STATUS_LABELS[trackingStatus] || "Searching"} icon={<Route size={16} />} />
                <SignalCard title="Your role" value={viewerRole === "driver" ? "Driver" : "Rider"} icon={<ShieldCheck size={16} />} />
                <SignalCard
                  title="Ride date"
                  value={booking?.date ? new Date(booking.date).toLocaleDateString() : "Not set"}
                  icon={<Calendar size={16} />}
                />
                <SignalCard title="GPS state" value={locationState} icon={<MapPin size={16} />} />
                <SignalCard title="Distance" value={distanceKm ? `${distanceKm.toFixed(2)} km` : "Waiting"} icon={<Navigation size={16} />} />
                <SignalCard title="ETA" value={etaMinutes ? `${etaMinutes} min` : "Waiting"} icon={<Clock3 size={16} />} />
              </div>

              {viewerRole === "driver" ? (
                <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">Driver controls</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <Button disabled={!!updatingStatus} onClick={() => handleStatusChange("accepted")} className="rounded-[18px] text-[10px] tracking-[0.24em]">
                      {updatingStatus === "accepted" ? <Loader2 size={14} className="animate-spin" /> : "Accepted"}
                    </Button>
                    <Button variant="ghost" disabled={!!updatingStatus} onClick={() => handleStatusChange("declined")} className="rounded-[18px] border-red-500/20 text-[10px] tracking-[0.24em] text-red-300 hover:bg-red-500/10">
                      {updatingStatus === "declined" ? <Loader2 size={14} className="animate-spin" /> : "Reject"}
                    </Button>
                    <Button disabled={!!updatingStatus} onClick={() => handleStatusChange("on_the_way")} className="rounded-[18px] text-[10px] tracking-[0.24em]">
                      {updatingStatus === "on_the_way" ? <Loader2 size={14} className="animate-spin" /> : "On the way"}
                    </Button>
                    <Button disabled={!!updatingStatus} onClick={() => handleStatusChange("completed")} className="rounded-[18px] text-[10px] tracking-[0.24em]">
                      {updatingStatus === "completed" ? <Loader2 size={14} className="animate-spin" /> : "Completed"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {geoError ? (
                <div className="mt-8 rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm leading-7 text-red-200">
                  {geoError}
                </div>
              ) : null}

              <div className="mt-8 space-y-4">
                <LocationCard
                  label="Driver"
                  tone="green"
                  location={driverLocation}
                  emptyText="Waiting for the driver to share location."
                />
                <LocationCard
                  label="Rider"
                  tone="orange"
                  location={riderLocation}
                  emptyText="Waiting for the rider to share location."
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SignalCard({ title, value, icon }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
      <div className="flex items-center gap-3 text-orange-300">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/35">{title}</span>
      </div>
      <p className="mt-4 text-lg font-black uppercase italic tracking-tight text-white">{value}</p>
    </div>
  );
}

function LocationCard({ label, tone, location, emptyText }) {
  const toneClass = tone === "green" ? "text-green-300" : "text-orange-300";

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4">
      <p className={`text-[10px] font-black uppercase tracking-[0.32em] ${toneClass}`}>{label}</p>
      {location?.lat && location?.lng ? (
        <>
          <p className="mt-3 text-sm leading-7 text-white/68">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
          <p className="text-[11px] text-white/35">
            Updated {location.updatedAt ? new Date(location.updatedAt).toLocaleTimeString() : "just now"}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm leading-7 text-white/45">{emptyText}</p>
      )}
    </div>
  );
}

function FitLiveBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(points, { padding: [60, 60] });
  }, [map, points]);

  return null;
}
