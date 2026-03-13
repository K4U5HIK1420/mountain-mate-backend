import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const RoutePreview = ({ fromCoords, toCoords }) => {

  return (
  <div className="mb-6 pointer-events-none">
    <MapContainer
      center={fromCoords}
      zoom={10}
      style={{ height: "400px", width: "100%", borderRadius: "20px" }}
      className="pointer-events-auto"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={fromCoords}>
        <Popup>Pickup Location</Popup>
      </Marker>

      <Marker position={toCoords}>
        <Popup>Destination</Popup>
      </Marker>

    </MapContainer>
  </div>
);
};

export default RoutePreview;