import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, ChevronLeft, Phone, MessageCircle, Clock } from "lucide-react";
import { SITAMap } from "../../components/SITAMap";
import { ridesApi, type RideData } from "../../services/api";
import { supabase } from "../../../lib/supabase";
import { getRoute, calculateETA, formatETAMinutes } from "../../services/routing";

const DRIVER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";


export function CustomerFinding() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { rideId?: string; pickup?: string; dropoff?: string } | null;
  const rideId = state?.rideId;
  const pickupText = state?.pickup || "Current Location";
  const dropoffText = state?.dropoff || "Destinasyon";

  const [phase, setPhase] = useState<"searching" | "found">("searching");
  const [countdown, setCountdown] = useState(10);
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | undefined>();
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);
  const [etaMinutes, setEtaMinutes] = useState<number>(0);
  const [customerLocation, setCustomerLocation] = useState<[number, number] | undefined>();

  useEffect(() => {
    if (!rideId) return;

    // Listen for ride status changes using Supabase Realtime
    const channel = supabase
      .channel(`ride_${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        async (payload) => {
          const updatedRide = payload.new as any;
          
          // When driver accepts the ride
          if (updatedRide.status === 'accepted') {
            // Fetch complete ride data with driver details
            try {
              const res = await ridesApi.get(rideId);
              setRideData(res.data);
              setPhase("found");
              
              // Get customer's current GPS location
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setCustomerLocation([lat, lng]);
                  },
                  () => {
                    // Fallback to pickup location from ride data
                    if (res.data.pickup_latitude && res.data.pickup_longitude) {
                      setCustomerLocation([res.data.pickup_latitude, res.data.pickup_longitude]);
                    }
                  }
                );
              }
            } catch (error) {
              console.error('Failed to fetch ride data:', error);
              setPhase("found");
            }
          }
          
          // When driver arrives at pickup point
          if (updatedRide.status === 'arrived') {
            // Show arrival notification (could use toast/alert)
            alert('Nakarating na ang iyong driver!');
          }
          
          // If ride is cancelled
          if (updatedRide.status === 'cancelled') {
            navigate("/customer/home");
          }
        }
      )
      .subscribe();

    // Set a 60-second timeout
    const timeout = setTimeout(() => {
      if (phase === "searching") {
        // No driver accepted within 60 seconds
        handleCancel();
      }
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeout);
    };
  }, [rideId, phase]);

  useEffect(() => {
    if (phase !== "found") return;
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [phase, countdown]);

  // Subscribe to driver location updates when driver accepts
  useEffect(() => {
    if (!rideData?.driver_id || phase !== "found") return;

    const driverChannel = supabase
      .channel(`driver_location_${rideData.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${rideData.driver_id}`,
        },
        (payload) => {
          const updatedDriver = payload.new as any;
          if (updatedDriver.current_latitude && updatedDriver.current_longitude) {
            setDriverLocation([updatedDriver.current_latitude, updatedDriver.current_longitude]);
          }
        }
      )
      .subscribe();

    // Fetch initial driver location
    supabase
      .from('drivers')
      .select('current_latitude, current_longitude')
      .eq('id', rideData.driver_id)
      .single()
      .then(({ data, error }) => {
        if (data && data.current_latitude && data.current_longitude) {
          setDriverLocation([data.current_latitude, data.current_longitude]);
        }
      });

    return () => {
      supabase.removeChannel(driverChannel);
    };
  }, [rideData?.driver_id, phase]);

  // Calculate route from driver to customer when both locations are available
  useEffect(() => {
    if (!driverLocation || !customerLocation || phase !== "found") return;

    getRoute(driverLocation[0], driverLocation[1], customerLocation[0], customerLocation[1]).then((route) => {
      if (route) {
        setRouteCoords(route.coordinates);
        setEtaMinutes(calculateETA(route.distanceKm));
      }
    });
  }, [driverLocation, customerLocation, phase]);

  const handleCancel = async () => {
    if (rideId) {
      try {
        await supabase.from('rides').update({ status: 'cancelled' }).eq('id', rideId);
      } catch { /* ignore */ }
    }
    navigate("/customer/home");
  };

  return (
    <div className="relative h-full w-full bg-white flex flex-col overflow-hidden">
      <div className="flex-1 relative">
        <SITAMap
          customerLocation={customerLocation}
          driverLocation={driverLocation}
          pickupLocation={customerLocation}
          routeCoordinates={routeCoords}
          className="w-full h-full"
        />
        <button
          onClick={() => navigate("/customer/home")}
          className="absolute top-12 left-4 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-4 h-4 text-gray-700" />
        </button>

        {/* ETA badge */}
        {phase === "found" && etaMinutes > 0 && (
          <div className="absolute top-24 left-4 bg-[#F47920]/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 z-10">
            <Clock className="w-4 h-4 text-white" />
            <div>
              <p className="text-[10px] text-white/80">ETA</p>
              <p className="text-white font-bold text-sm">{formatETAMinutes(etaMinutes)}</p>
            </div>
          </div>
        )}

        {phase === "searching" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 border-[#F47920]"
                initial={{ width: 40, height: 40, opacity: 0.8 }}
                animate={{ width: 130, height: 130, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
              />
            ))}
            <div className="w-12 h-12 bg-[#F47920] rounded-full flex items-center justify-center shadow-lg z-10">
              <span className="text-2xl">🛺</span>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {phase === "searching" ? (
          <motion.div
            key="searching"
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            className="bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-8"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-[#F47920]/10 flex items-center justify-center">
                  <span className="text-3xl">🛺</span>
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 bg-[#F47920] rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              </div>
              <div className="flex-1">
                <h3 className="text-gray-800 font-bold text-base">Naghahanap ng tricycle...</h3>
                <p className="text-gray-400 text-sm">Kinokonekta ka sa pinakamalapit na driver</p>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="w-8 h-8 rounded-full border-2 border-[#F47920] border-t-transparent"
              />
            </div>

            <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500">Pickup: {pickupText}</span>
              </div>
              <div className="w-px h-3 bg-gray-300 ml-[3px]" />
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-2 h-2 text-[#F47920]" />
                <span className="text-xs text-gray-500">Dropoff: {dropoffText}</span>
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="mt-4 w-full py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Kanselahin ang Booking
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="found"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-8"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center gap-1 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-600 text-xs font-semibold">Nahanap ang Driver!</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <img src={DRIVER_IMAGE} alt="Driver" className="w-14 h-14 rounded-full object-cover border-2 border-[#F47920]" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5 shadow text-[9px] font-bold text-[#F47920] border border-orange-100">
                  ★ 4.8
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-gray-800 font-bold text-base">
                  {rideData ? `${rideData.driver_first_name} ${rideData.driver_last_name}` : "Naglo-load..."}
                </h3>
                <p className="text-gray-500 text-xs">Tricycle · <span className="font-semibold text-gray-700">{rideData?.plate_number || "---"}</span></p>
                <p className="text-xs text-[#F47920] font-medium mt-0.5">Darating sa {countdown}s</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button className="w-9 h-9 rounded-full bg-[#F47920]/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-[#F47920]" />
                </button>
                <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400">Estimated Fare</p>
                <p className="text-gray-800 font-bold text-xl">₱ {rideData ? rideData.fare_amount.toFixed(2) : "--"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Distance</p>
                <p className="text-gray-700 font-semibold text-sm">{rideData ? `${rideData.distance_km} km` : "--"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Est. Time</p>
                <p className="text-gray-700 font-semibold text-sm">~8 min</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/customer/ride", { state: { rideId, rideData } })}
              className="w-full bg-[#F47920] text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-orange-200"
            >
              Simulan ang Sakay 🛺
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}