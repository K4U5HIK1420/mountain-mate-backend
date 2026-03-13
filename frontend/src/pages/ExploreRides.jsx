import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

import API from "../utils/api";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Loader2,
  Navigation,
  Plus,
  Minus,
  X,
  ShieldCheck,
  CreditCard
} from "lucide-react";

import { useNotify } from "../context/NotificationContext";
import RoutePreview from "../components/RoutePreview";

const ExploreRides = () => {

  const { notify } = useNotify();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [pickupFilter, setPickupFilter] = useState("");
  const [dropFilter, setDropFilter] = useState("");

  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);

  /* disable scroll when modal open */
  useEffect(() => {
    if (selectedRide) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [selectedRide]);


  /* load rides */
  const loadApprovedRides = async () => {

    setLoading(true);

    try {

      const res = await API.get("/transport/all");
      setRides(res.data.data || res.data || []);

    } catch (err) {

      console.error("Ride fetch error:", err);
      setRides([]);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadApprovedRides();
  }, []);


  /* search */
  const fetchListings = async () => {

    setLoading(true);

    try {

      const response = await API.get("/transport/search", {
        params: {
          from: pickupFilter.toLowerCase(),
          to: dropFilter.toLowerCase()
        }
      });

      setRides(response.data.data || response.data || []);

    } catch (error) {

      console.error("Search error:", error);
      setRides([]);

    } finally {

      setLoading(false);

    }
  };


  /* booking */
  const bookRide = async () => {

    try {

      setIsProcessing(true);

      const res = await API.post("/transport/book", {
        rideId: selectedRide._id,
        seats: bookingSeats
      });

      if (res.data.success) {

        notify("Booking Successful! Redirecting to Driver's WhatsApp...", "success");

        const message =
          `Namaste! I just booked ${bookingSeats} seat(s) in your ${selectedRide.vehicleType} (${selectedRide.vehicleNumber}) for the route ${selectedRide.routeFrom} to ${selectedRide.routeTo} via Mountain Mate. 🏔️`;

        const whatsappUrl =
          `https://wa.me/${selectedRide.contactNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank");

        setSelectedRide(null);
        loadApprovedRides();

      }

    } catch {

      notify("Booking failed. Please try again.", "error");

    } finally {

      setIsProcessing(false);

    }
  };


  /* socket updates */
  useEffect(() => {

    socket.on("seatsUpdated", (data) => {

      setRides(prev =>
        prev.map(r =>
          r._id === data.rideId
            ? { ...r, seatsAvailable: data.seatsAvailable }
            : r
        )
      );

    });

    return () => socket.off("seatsUpdated");

  }, []);


  /* convert location -> coords */
  const getCoordinates = async (place) => {

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
    );

    const data = await res.json();

    if (data.length > 0)
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];

    return null;
  };


  /* open modal */
  const openRide = async (ride) => {

    const from = await getCoordinates(ride.routeFrom);
    const to = await getCoordinates(ride.routeTo);

    setFromCoords(from);
    setToCoords(to);

    setSelectedRide(ride);
    setBookingSeats(1);
  };


  return (

    <div className="relative min-h-screen pt-40 pb-32 px-8 selection:bg-orange-600 selection:text-white">

      {/* background */}
      <img
        src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500"
        className="fixed inset-0 w-full h-full object-cover grayscale-[30%] z-[-1]"
        alt=""
      />

      <div className="fixed inset-0 bg-black/75 backdrop-blur-[6px] z-[-1]" />


      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 max-w-7xl mx-auto"
      >

        {/* HEADER */}
        <div className="max-w-4xl mx-auto mb-20 text-center">

          <h1 className="text-7xl font-black text-white italic uppercase tracking-tighter mb-8">
            FIND YOUR <span className="text-orange-600">FLEET.</span>
          </h1>


          <div className="bg-white/5 backdrop-blur-3xl p-4 rounded-[40px] border border-white/10 flex flex-col md:flex-row gap-3 shadow-2xl">

            <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-[30px] flex-1 border border-white/5">

              <MapPin className="text-orange-600" size={20} />

              <input
                onChange={(e) => setPickupFilter(e.target.value)}
                placeholder="PICKUP LOCATION..."
                className="bg-transparent w-full text-white outline-none uppercase text-xs tracking-widest"
              />

            </div>


            <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-[30px] flex-1 border border-white/5">

              <Navigation className="text-orange-600" size={20} />

              <input
                onChange={(e) => setDropFilter(e.target.value)}
                placeholder="DESTINATION..."
                className="bg-transparent w-full text-white outline-none uppercase text-xs tracking-widest"
              />

            </div>


            <button
              onClick={fetchListings}
              className="bg-orange-600 hover:bg-white hover:text-black text-white px-10 py-4 rounded-[30px] font-black uppercase transition-all"
            >
              SEARCH
            </button>

          </div>

        </div>


        {/* RIDES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

          {loading ? (

            <div className="col-span-full flex justify-center py-40">
              <Loader2 className="animate-spin text-orange-600" size={60}/>
            </div>

          ) : rides.length === 0 ? (

            <div className="col-span-full text-center text-white/20 font-black tracking-[1em] py-40 uppercase italic">
              Vault Empty: No Rides Found
            </div>

          ) : (

            rides.map((ride) => (

              <motion.div
                key={ride._id}
                whileHover={{ y: -12 }}
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[50px] overflow-hidden flex flex-col group shadow-2xl relative"
              >

                {/* preview route */}
                <button
                  onClick={() => openRide(ride)}
                  className="absolute top-4 right-4 bg-orange-600 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-lg hover:bg-white hover:text-black transition-all"
                >
                  Preview Route
                </button>


                <div className="h-60 relative overflow-hidden">

                  <img
                    src={ride.images?.[0] || "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt=""
                  />

                  <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
                    <p className="text-orange-500 text-[10px] font-black tracking-widest uppercase">
                      {ride.seatsAvailable} SEATS LEFT
                    </p>
                  </div>

                </div>


                <div className="p-10 space-y-6">

                  <div className="flex justify-between items-start">

                    <div>

                      <h3 className="text-2xl font-black text-white uppercase italic">
                        {ride.vehicleType || "Innova Crysta"}
                      </h3>

                      <p className="text-white/40 text-xs">
                        {ride.routeFrom} ➔ {ride.routeTo}
                      </p>

                    </div>

                    <p className="text-2xl font-black text-white">
                      ₹{ride.pricePerSeat}
                    </p>

                  </div>


                  <button
                    onClick={() => openRide(ride)}
                    className="w-full bg-white/5 border border-white/10 text-white py-5 rounded-[25px] font-black uppercase text-[10px] tracking-[0.3em] transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-600/40"
                  >
                    SECURE SEAT & VIEW DETAILS
                  </button>

                </div>

              </motion.div>

            ))

          )}

        </div>

      </motion.div>


      {/* MODAL */}
      <AnimatePresence>

        {selectedRide && (

          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRide(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />

            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[50px] overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >

              <button
                onClick={() => setSelectedRide(null)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/80 text-white z-[9999]"
              >
                <X size={20}/>
              </button>


              <div className="w-full md:w-1/2">

                <img
                  src={selectedRide.images?.[0]}
                  className="w-full h-full object-cover"
                  alt=""
                />

              </div>


              <div className="w-full md:w-1/2 p-10">

                <h2 className="text-4xl font-black text-white italic mb-4">
                  {selectedRide.vehicleType}
                </h2>


                {fromCoords && toCoords && (
                  <RoutePreview
                    fromCoords={fromCoords}
                    toCoords={toCoords}
                  />
                )}


                <div className="flex justify-between items-center mt-8">

                  <button onClick={()=>setBookingSeats(p=>Math.max(1,p-1))}>
                    <Minus/>
                  </button>

                  <span className="text-white text-xl">{bookingSeats}</span>

                  <button onClick={()=>setBookingSeats(p=>Math.min(selectedRide.seatsAvailable,p+1))}>
                    <Plus/>
                  </button>

                </div>


                <button
                  onClick={bookRide}
                  className="mt-8 w-full bg-orange-600 text-white py-4 rounded-xl"
                >
                  CONFIRM & TRANSMIT
                </button>

              </div>

            </motion.div>

          </div>

        )}

      </AnimatePresence>

    </div>
  );
};

export default ExploreRides;