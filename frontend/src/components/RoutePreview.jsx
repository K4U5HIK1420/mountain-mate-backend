import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { normalizeCoords } from "../utils/location";

const defaultCenter = { lat: 30.7333, lng: 79.0667 };

const toRad = (value) => (value * Math.PI) / 180;

const getDistanceKm = (pointA, pointB) => {
  if (!pointA || !pointB) return null;
  const earthKm = 6371;
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);
  const lat1 = toRad(pointA.lat);
  const lat2 = toRad(pointB.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earthKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 10);
      return;
    }

    map.fitBounds(points, {
      padding: [28, 28],
    });
  }, [map, points]);

  return null;
}

const RoutePreview = ({ pickupCoords, destinationCoords }) => {
  const [tileFailed, setTileFailed] = useState(false);
  const pickup = normalizeCoords(pickupCoords);
  const destination = normalizeCoords(destinationCoords);
  const points = [pickup, destination].filter(Boolean);
  const center = pickup || destination || defaultCenter;
  const distanceKm = pickup && destination ? getDistanceKm(pickup, destination) : null;
  const mapKey = useMemo(
    () => points.map((point) => `${point.lat.toFixed(5)}:${point.lng.toFixed(5)}`).join("|") || "default",
    [points]
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-2 text-[12px] text-white/80 sm:grid-cols-2">
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2">
          <span className="font-semibold text-blue-200">Route preview</span>
          <p className="mt-1 text-white/70">{points.length === 2 ? "Pickup and destination pinned." : "Add both locations to preview the route."}</p>
        </div>
        <div className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2">
          <span className="font-semibold text-orange-200">Distance</span>
          <p className="mt-1 text-white/70">{distanceKm ? `${distanceKm.toFixed(1)} km (approx.)` : "Distance will appear once both points are set."}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        {tileFailed ? (
          <div className="absolute inset-x-3 top-3 z-[500] rounded-xl border border-amber-400/20 bg-[#0a0a0a]/90 px-3 py-2 text-[11px] text-amber-100 shadow-lg backdrop-blur-xl">
            Live map tiles are temporarily unavailable. Route points and distance are still shown from your saved locations.
          </div>
        ) : null}
        <MapContainer
          key={mapKey}
          center={center}
          zoom={8}
          scrollWheelZoom={false}
          style={{ height: "260px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setTileFailed(true),
              load: () => setTileFailed(false),
            }}
          />
          <FitBounds points={points} />
          {pickup ? (
            <CircleMarker
              center={pickup}
              radius={8}
              pathOptions={{ color: "#fb923c", weight: 2, fillColor: "#f97316", fillOpacity: 0.9 }}
            />
          ) : null}
          {destination ? (
            <CircleMarker
              center={destination}
              radius={8}
              pathOptions={{ color: "#fdba74", weight: 2, fillColor: "#facc15", fillOpacity: 0.85 }}
            />
          ) : null}
          {pickup && destination ? (
            <Polyline positions={[pickup, destination]} pathOptions={{ color: "#f97316", weight: 4, opacity: 0.8 }} />
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
};

export default RoutePreview;
