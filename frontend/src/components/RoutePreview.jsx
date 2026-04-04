import { useEffect, useMemo, useState } from "react";
import { DirectionsRenderer, GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

const toMetrics = (route) => {
  const leg = route?.legs?.[0];
  return {
    distanceKm: ((leg?.distance?.value || 0) / 1000).toFixed(2),
    etaMin: Math.round((leg?.duration_in_traffic?.value || leg?.duration?.value || 0) / 60),
  };
};

const normalizeCoords = (coords) => {
  const lat = Number(coords?.lat);
  const lng = Number(coords?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const RoutePreview = ({ pickupCoords, destinationCoords }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [directions, setDirections] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [mapRef, setMapRef] = useState(null);
  const normalizedPickup = useMemo(() => normalizeCoords(pickupCoords), [pickupCoords]);
  const normalizedDestination = useMemo(() => normalizeCoords(destinationCoords), [destinationCoords]);

  useEffect(() => {
    if (!normalizedPickup || !normalizedDestination) {
      setDirections(null);
      setRouteError("");
      return;
    }
    if (!isLoaded || !window.google?.maps?.DirectionsService) return;

    const service = new window.google.maps.DirectionsService();
    const baseRequest = {
      origin: normalizedPickup,
      destination: normalizedDestination,
      travelMode: window.google.maps.TravelMode.DRIVING,
      region: "IN",
    };

    const richRequest = {
      ...baseRequest,
      provideRouteAlternatives: true,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
      },
    };

    const handleResponse = (result, status, retryWithBaseOnly = false) => {
      if (status === "OK" && result?.routes?.length) {
        setDirections(result);
        setRouteError("");
        return;
      }

      if (!retryWithBaseOnly) {
        service.route(baseRequest, (fallbackResult, fallbackStatus) => {
          handleResponse(fallbackResult, fallbackStatus, true);
        });
        return;
      }

      setDirections(null);
      if (status === "REQUEST_DENIED") {
        setRouteError("Directions API access denied. Google Cloud me Directions API + billing enable karo.");
        return;
      }
      if (status === "ZERO_RESULTS") {
        setRouteError("In dono points ke beech drivable route nahi mila.");
        return;
      }
      if (status === "OVER_QUERY_LIMIT") {
        setRouteError("Google route quota hit ho gaya. Thodi der baad try karo.");
        return;
      }
      setRouteError(`Route fetch failed (${status || "UNKNOWN_ERROR"}).`);
    };

    service.route(richRequest, (result, status) => {
      handleResponse(result, status);
    });
  }, [normalizedPickup, normalizedDestination, isLoaded]);

  const routes = directions?.routes || [];

  const recommendedRoute = useMemo(() => routes[0] || null, [routes]);
  const shortestRoute = useMemo(() => {
    if (!routes.length) return null;
    return routes.reduce((best, current) => {
      const bestDistance = best?.legs?.[0]?.distance?.value || Number.MAX_SAFE_INTEGER;
      const currentDistance = current?.legs?.[0]?.distance?.value || Number.MAX_SAFE_INTEGER;
      return currentDistance < bestDistance ? current : best;
    }, routes[0]);
  }, [routes]);

  const recommendedIndex = useMemo(
    () => (recommendedRoute ? routes.findIndex((route) => route === recommendedRoute) : -1),
    [recommendedRoute, routes]
  );
  const shortestIndex = useMemo(
    () =>
      shortestRoute && shortestRoute !== recommendedRoute
        ? routes.findIndex((route) => route === shortestRoute)
        : -1,
    [recommendedRoute, routes, shortestRoute]
  );

  const recommendedMetrics = recommendedRoute ? toMetrics(recommendedRoute) : null;
  const shortestMetrics = shortestRoute ? toMetrics(shortestRoute) : null;

  useEffect(() => {
    if (!mapRef || !recommendedRoute?.overview_path?.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    recommendedRoute.overview_path.forEach((point) => bounds.extend(point));
    mapRef.fitBounds(bounds);
  }, [mapRef, recommendedRoute]);

  if (loadError) {
    return <div style={{ color: "#ffb4b4" }}>Google Map load error. API key check karo.</div>;
  }

  if (!isLoaded) {
    return <div style={{ color: "white" }}>Loading map...</div>;
  }

  return (
    <>
      {(!normalizedPickup || !normalizedDestination) && (
        <div style={{ color: "white" }}>Origin aur destination set karo.</div>
      )}

      {recommendedMetrics ? (
        <div
          style={{
            display: "grid",
            gap: "8px",
            marginBottom: "10px",
            gridTemplateColumns: "1fr",
          }}
        >
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1d4ed8",
              color: "#bfdbfe",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            Google Recommended: <b>{recommendedMetrics.distanceKm} km</b> | ETA:{" "}
            <b>{recommendedMetrics.etaMin} min</b>
          </div>
          {shortestIndex >= 0 && shortestMetrics ? (
            <div
              style={{
                background: "#1f1302",
                border: "1px solid #f59e0b",
                color: "#fde68a",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              Shortest (Alt): <b>{shortestMetrics.distanceKm} km</b> | ETA: <b>{shortestMetrics.etaMin} min</b>
            </div>
          ) : null}
        </div>
      ) : null}

      {routeError ? (
        <div
          style={{
            background: "#2a1212",
            color: "#ffb4b4",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "10px",
            fontSize: "13px",
          }}
        >
          {routeError}
        </div>
      ) : null}

      <GoogleMap
        mapContainerStyle={{ height: "260px", borderRadius: "16px" }}
        center={{ lat: normalizedPickup?.lat ?? 30.7333, lng: normalizedPickup?.lng ?? 79.0667 }}
        zoom={10}
        onLoad={(map) => setMapRef(map)}
        options={{ styles: mapStyles, disableDefaultUI: true }}
      >
        {normalizedPickup ? <Marker position={normalizedPickup} /> : null}
        {normalizedDestination ? <Marker position={normalizedDestination} /> : null}

        {shortestIndex >= 0 && directions ? (
          <DirectionsRenderer
            directions={directions}
            routeIndex={shortestIndex}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#f59e0b",
                strokeOpacity: 0.75,
                strokeWeight: 4,
              },
            }}
          />
        ) : null}

        {recommendedIndex >= 0 && directions ? (
          <DirectionsRenderer
            directions={directions}
            routeIndex={recommendedIndex}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#3b82f6",
                strokeOpacity: 0.95,
                strokeWeight: 6,
              },
            }}
          />
        ) : null}
      </GoogleMap>
    </>
  );
};

export default RoutePreview;
