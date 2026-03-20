import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import { useMap } from "react-leaflet";

const RoutePreview = ({ pickupCoords, destinationCoords }) => {

  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {

    if (!pickupCoords || !destinationCoords) return;

    const getRoute = async () => {

      try {

        const url = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${destinationCoords.lng},${destinationCoords.lat}?overview=full&geometries=geojson`;

        const res = await axios.get(url);

        const routeData = res.data.routes[0];

        const coordinates = routeData.geometry.coordinates;

        const formatted = coordinates.map(coord => [coord[1], coord[0]]);

        setRoute(formatted);

        setDistance((routeData.distance / 1000).toFixed(2));
        setEta(Math.round(routeData.duration / 60));

      } catch (err) {
        // Route fetch failed
      }

    };

    getRoute();

  }, [pickupCoords, destinationCoords]);

  return (
    <>
      {(!pickupCoords || !destinationCoords) && (
        <div style={{ color: "white" }}>Loading route...</div>
      )}

      {distance && eta && (
        <div
          style={{
            background: "#111",
            color: "white",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "10px",
            fontSize: "14px"
          }}
        >
          🚗 Distance: <b>{distance} km</b> | ⏱ ETA: <b>{eta} min</b>
        </div>
      )}

      <MapContainer
        center={[
          pickupCoords?.lat ?? 30.7333,
          pickupCoords?.lng ?? 79.0667,
        ]}
        zoom={10}
        style={{ height: "260px", borderRadius: "16px"}}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickupCoords ? <Marker position={[pickupCoords.lat, pickupCoords.lng]} /> : null}
        {destinationCoords ? (
          <Marker position={[destinationCoords.lat, destinationCoords.lng]} />
        ) : null}

        {route.length > 0 && (
          <>
            <Polyline
              positions={route}
              color="#3b82f6"
              weight={5}
              opacity={0.9}
            />
            <FitBounds route={route} />
          </>
        )}

      </MapContainer>
    </>
  );
};

function FitBounds({ route }) {
  const map = useMap();

  useEffect(() => {
    if (route.length > 0) {
      map.fitBounds(route, {
        padding: [50, 50],
      });
    }
  }, [route, map]);

  return null;
}

export default RoutePreview;