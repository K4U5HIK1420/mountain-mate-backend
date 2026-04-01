import React, { useState, useRef, useEffect } from "react";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";

// IMPORTANT: Replace with a real booking ID and a user ID for a driver.
const FAKE_BOOKING_ID = "60d5f1b3e6e1f3b3e8e1a1a1";

export default function DriverSimulation() {
  const { user } = useAuth();
  const [isSimulating, setIsSimulating] = useState(false);
  const intervalRef = useRef(null);

  const [location, setLocation] = useState({
    lat: 30.3165,
    lng: 78.0322,
    heading: 0,
    speed: 50,
  });

  const actorId = String(user?.id || user?._id || "");

  const startSimulation = () => {
    if (!actorId) {
      alert("Please log in as a driver to start the simulation.");
      return;
    }
    setIsSimulating(true);
    intervalRef.current = setInterval(() => {
      setLocation(prevLocation => {
        const newLat = prevLocation.lat + (Math.random() - 0.5) * 0.01;
        const newLng = prevLocation.lng + (Math.random() - 0.5) * 0.01;
        const newHeading = (prevLocation.heading + (Math.random() - 0.5) * 10) % 360;

        const payload = {
          bookingId: FAKE_BOOKING_ID,
          userId: actorId,
          lat: newLat,
          lng: newLng,
          heading: newHeading,
          speed: prevLocation.speed,
          accuracy: 5,
        };

        socket.emit("driver-location-update", payload);
        return { ...prevLocation, lat: newLat, lng: newLng, heading: newHeading };
      });
    }, 3000);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    clearInterval(intervalRef.current);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed bottom-10 right-10 z-[99999] rounded-lg bg-white p-4 shadow-lg">
      <h3 className="text-lg font-bold">Driver Simulation</h3>
      <p className="text-sm">Booking ID: {FAKE_BOOKING_ID}</p>
      <div className="mt-4">
        {isSimulating ? (
          <Button onClick={stopSimulation} variant="destructive">Stop Simulation</Button>
        ) : (
          <Button onClick={startSimulation}>Start Simulation</Button>
        )}
      </div>
      <div className="mt-4 text-xs">
        <p>Lat: {location.lat.toFixed(4)}</p>
        <p>Lng: {location.lng.toFixed(4)}</p>
      </div>
    </div>
  );
}
