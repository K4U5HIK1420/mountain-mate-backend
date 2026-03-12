import API from "../utils/api";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Navigation, Users, Calendar, Plus, Minus } from 'lucide-react';

const ExploreRides = () => {

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSeats, setBookingSeats] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [pickupFilter, setPickupFilter] = useState('');
  const [dropFilter, setDropFilter] = useState('');
  const [travelDate, setTravelDate] = useState('');

  const selectorRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  // Load approved rides
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

  useEffect(() => {
    loadApprovedRides();
  }, []);

  // Search rides
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
            date: travelDate
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

  // BOOK RIDE
  const bookRide = async () => {

    try {

      setIsProcessing(true);

      await API.post("/transport/book", {
        rideId: selectedRide._id,
        seats: bookingSeats
      });

      alert("Booking Successful!");

      setSelectedRide(null);

      loadApprovedRides();

    } catch (err) {

      alert("Booking failed");

    } finally {

      setIsProcessing(false);

    }
  };

  return (

    <div className="relative min-h-screen pt-40 pb-32 px-8">

      <img
        src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2500"
        className="fixed inset-0 w-full h-full object-cover grayscale-[30%]"
        alt="bg"
      />

      <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[-1]"></div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 max-w-7xl mx-auto"
      >

        {/* SEARCH BAR */}

        <div className="max-w-7xl mx-auto mb-24 px-4">

          <h1 className="text-7xl font-black text-white italic uppercase tracking-tighter mb-12 text-center">
            BOOK YOUR <span className="text-orange-600">RIDE.</span>
          </h1>

          <div className="bg-white/5 backdrop-blur-3xl p-3 rounded-[50px] border border-white/10 flex gap-2">

            <div className="flex items-center gap-4 px-8 py-6 bg-white/5 rounded-[40px] border border-white/5 flex-1">
              <MapPin className="text-orange-600" size={22}/>
              <input
                type="text"
                onChange={(e) => setPickupFilter(e.target.value)}
                placeholder="LEAVING FROM..."
                className="bg-transparent w-full text-white font-black outline-none uppercase"
              />
            </div>

            <div className="flex items-center gap-4 px-8 py-6 bg-white/5 rounded-[40px] border border-white/5 flex-1">
              <Navigation className="text-orange-600" size={22}/>
              <input
                type="text"
                onChange={(e) => setDropFilter(e.target.value)}
                placeholder="GOING TO..."
                className="bg-transparent w-full text-white font-black outline-none uppercase"
              />
            </div>

            <button
              onClick={fetchListings}
              className="bg-orange-600 text-white px-10 py-6 rounded-[40px] font-black uppercase"
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
                  whileHover={{ y: -15 }}
                  className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[60px] overflow-hidden flex flex-col group hover:border-orange-600/40 transition-all duration-500 shadow-2xl"
              >

                <div className="h-64 relative overflow-hidden">
                  <img
                    src={ride.images?.[0] || "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    alt="ride"
                  />
                </div>

                <div className="p-10 space-y-6">

                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                    {ride.vehicleType}
                  </h3>

                  <p className="text-white/40 text-sm font-bold">
                    {ride.routeFrom} → {ride.routeTo}
                  </p>

                  <p className="text-3xl font-black text-white">
                    ₹{ride.pricePerSeat}
                  </p>

                  <p className="text-orange-500 text-sm font-bold">
                    {ride.seatsAvailable} seats left
                  </p>

                  <button
                    onClick={() => {
                      setSelectedRide(ride);
                      setBookingSeats(1);
                    }}
                    className="w-full bg-orange-600 text-white py-4 rounded-xl font-black"
                  >
                    Select Seats
                  </button>

                </div>

              </motion.div>

            ))

          )}

        </div>

      </motion.div>

      {/* BOOKING MODAL */}

      <AnimatePresence>

        {selectedRide && (

          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            <motion.div
              className="bg-zinc-900 border border-white/10 p-10 rounded-[50px] w-[420px] text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >

              <h2 className="text-3xl font-black text-white mb-8">
                Select Seats
              </h2>

              <div className="flex justify-center items-center gap-6 mb-8">

                <button
                  onClick={() => setBookingSeats(prev =>
                    Math.max(1, prev - 1)
                  )}
                  className="bg-white/10 p-4 rounded-full"
                >
                  <Minus size={18}/>
                </button>

                <span className="text-4xl text-white font-black">
                  {bookingSeats}
                </span>

                <button
                  onClick={() => setBookingSeats(prev =>
                    Math.min(selectedRide.seatsAvailable, prev + 1)
                  )}
                  className="bg-orange-600 p-4 rounded-full"
                >
                  <Plus size={18}/>
                </button>

              </div>

              <button
                onClick={bookRide}
                disabled={isProcessing}
                className="w-full bg-orange-600 py-4 rounded-xl text-white font-black"
              >
                {isProcessing
                  ? "Processing..."
                  : `Pay ₹${selectedRide.pricePerSeat * bookingSeats}`
                }
              </button>

              <button
                onClick={() => setSelectedRide(null)}
                className="mt-4 text-white/40 text-sm"
              >
                Cancel
              </button>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  );
};

export default ExploreRides;