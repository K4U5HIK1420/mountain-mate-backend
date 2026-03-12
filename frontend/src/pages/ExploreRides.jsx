import API from "../utils/api";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Car, ChevronRight, ShieldCheck, Loader2, X, Check, Navigation, Users, Calendar, Plus, Minus } from 'lucide-react';

const ExploreRides = () => {

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Search states
  const [pickupFilter, setPickupFilter] = useState('');
  const [dropFilter, setDropFilter] = useState('');
  const [travelDate, setTravelDate] = useState('');

  const [showPassSelector, setShowPassSelector] = useState(false);
  const [passengerCount, setPassengerCount] = useState(1);

  const selectorRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  // close passenger selector on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setShowPassSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, []);

  // load approved rides initially
  useEffect(() => {
    const loadApprovedRides = async () => {

      setLoading(true);

      try {

        const res = await API.get("/transport/all");

        setRides(res.data.data || res.data);

      } catch (err) {

        console.error("Initial ride fetch error:", err);
        setRides([]);

      } finally {

        setLoading(false);

      }
    };

    loadApprovedRides();

  }, []);


  // search rides
  const fetchListings = async () => {

    setLoading(true);

    try {

      let response;

      if (!pickupFilter && !dropFilter && !travelDate) {

        response = await API.get("/transport/all");

      } else {

        response = await API.get("/transport/search", {
          params: {
            pickup: pickupFilter.toLowerCase(),
            drop: dropFilter.toLowerCase(),
            date: travelDate,
            passengers: passengerCount
          }
        });

      }

      setRides(response.data.data || response.data);

    } catch (error) {

      console.error("Error fetching rides:", error);
      setRides([]);

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="relative min-h-screen pt-40 pb-32 px-8">

      {/* Background */}
      <img
        src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500"
        className="fixed inset-0 w-full h-full object-cover grayscale-[30%]"
        alt="bg"
      />

      <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[-1]"></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-7xl mx-auto">

        {/* SEARCH BAR */}

        <div className="max-w-7xl mx-auto mb-24 px-4">

          <h1 className="text-7xl font-black text-white italic uppercase tracking-tighter mb-12 text-center">
            BOOK YOUR <span className="text-orange-600">RIDE.</span>
          </h1>

          <div className="bg-white/5 backdrop-blur-3xl p-3 rounded-[50px] border border-white/10 flex flex-col lg:flex-row items-stretch gap-2">

            {/* pickup */}

            <div className="flex-[1.5] flex items-center gap-4 px-8 py-6 bg-white/5 rounded-[40px] border border-white/5">
              <MapPin className="text-orange-600" size={22}/>
              <input
                type="text"
                onChange={(e) => setPickupFilter(e.target.value)}
                placeholder="LEAVING FROM..."
                className="bg-transparent w-full text-white font-black outline-none uppercase placeholder:text-white/20"
              />
            </div>

            {/* drop */}

            <div className="flex-[1.5] flex items-center gap-4 px-8 py-6 bg-white/5 rounded-[40px] border border-white/5">
              <Navigation className="text-orange-600" size={22}/>
              <input
                type="text"
                onChange={(e) => setDropFilter(e.target.value)}
                placeholder="GOING TO..."
                className="bg-transparent w-full text-white font-black outline-none uppercase placeholder:text-white/20"
              />
            </div>

            {/* date */}

            <div className="flex-1 flex items-center gap-4 px-7 py-6 bg-white/5 rounded-[40px] border border-white/5">
              <Calendar className="text-orange-600" size={20}/>
              <input
                type="date"
                min={today}
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="bg-transparent text-white font-black outline-none"
              />
            </div>

            {/* passengers */}

            <div className="flex-1 relative" ref={selectorRef}>

              <div
                onClick={() => setShowPassSelector(!showPassSelector)}
                className="flex items-center justify-center gap-4 px-6 py-6 rounded-[40px] border border-white/5 bg-white/5 cursor-pointer"
              >
                <Users className="text-orange-600" size={20}/>
                <span className="text-white font-black uppercase text-[11px]">
                  {passengerCount} Passenger
                </span>
              </div>

              <AnimatePresence>

                {showPassSelector && (

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[105%] right-0 bg-black border border-white/10 p-6 rounded-3xl"
                  >

                    <div className="flex items-center gap-5">

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPassengerCount(Math.max(1, passengerCount - 1));
                        }}
                        className="bg-white/10 p-3 rounded-full"
                      >
                        <Minus size={14}/>
                      </button>

                      <span className="text-white font-bold">{passengerCount}</span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPassengerCount(Math.min(8, passengerCount + 1));
                        }}
                        className="bg-orange-600 p-3 rounded-full"
                      >
                        <Plus size={14}/>
                      </button>

                    </div>

                  </motion.div>

                )}

              </AnimatePresence>

            </div>

            {/* search */}

            <button
              onClick={fetchListings}
              className="bg-orange-600 text-white px-14 py-6 rounded-[40px] font-black uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Search
            </button>

          </div>
        </div>


        {/* RIDES GRID */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">

          {loading ? (

            <div className="col-span-full flex justify-center py-40">
              <Loader2 className="animate-spin text-orange-600" size={50}/>
            </div>

          ) : rides.length === 0 ? (

            <div className="col-span-full text-center text-white/20 font-black tracking-widest">
              NO RIDES AVAILABLE
            </div>

          ) : (

            rides.map((ride) => (

              <motion.div
                key={ride._id}
                whileHover={{ y: -10 }}
                className="bg-white/[0.03] border border-white/10 rounded-[60px] overflow-hidden"
              >

                <div className="h-64 overflow-hidden">

                  <img
                    src={ride.images?.[0] || "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf"}
                    className="w-full h-full object-cover"
                    alt="ride"
                  />

                </div>

                <div className="p-10 space-y-6">

                  <h3 className="text-3xl font-black text-white italic">
                    {ride.vehicleName}
                  </h3>

                  <p className="text-white/40 text-sm">
                    {ride.pickupLocation || ride.location} → {ride.dropLocation || "Destination"}
                  </p>

                  <p className="text-2xl font-black text-white">
                    ₹{ride.pricePerSeat}
                  </p>

                  <button
                    onClick={() => setSelectedRide(ride)}
                    className="w-full bg-orange-600 text-white py-4 rounded-xl font-black hover:bg-white hover:text-black transition-all"
                  >
                    Select Seats
                  </button>

                </div>

              </motion.div>

            ))

          )}

        </div>

      </motion.div>

    </div>
  );
};

export default ExploreRides;