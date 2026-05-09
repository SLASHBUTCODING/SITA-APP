import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Clock, X, Navigation } from "lucide-react";
import { getStoredUser, type DriverData } from "../../services/api";
import { supabase } from "../../../lib/supabase";
import { avatarUrl } from "../../lib/avatar";

type RideState = {
  rideId: string;
  pickupAddress: string;
  dropoffAddress: string;
  fare?: number;
  distance?: number;
  customerName?: string;
  customerAvatarUrl?: string;
};

export function DriverRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rideData, setRideData] = useState<RideState | null>(
    (location.state as RideState | null) ?? null
  );

  const driver = getStoredUser<DriverData>();
  const driverId = driver?.id;

  // Re-fetch the ride from Supabase if we landed here without state (e.g. hard refresh).
  // Bounce home if rideId is missing entirely or the ride is no longer 'requested'.
  useEffect(() => {
    const stateRideId = (location.state as RideState | null)?.rideId;
    if (!stateRideId) {
      navigate("/driver/home");
      return;
    }
    if (rideData) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("id, pickup_address, dropoff_address, fare_amount, distance_km, status, customer_id")
        .eq("id", stateRideId)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data || data.status !== "requested") {
        navigate("/driver/home");
        return;
      }

      let customerName: string | undefined;
      let customerAvatarUrl: string | undefined;
      if (data.customer_id) {
        const { data: cust } = await supabase
          .from("users")
          .select("first_name,last_name,profile_photo_url")
          .eq("id", data.customer_id)
          .maybeSingle();
        if (cust) {
          customerName = `${cust.first_name ?? ""} ${cust.last_name ?? ""}`.trim() || undefined;
          customerAvatarUrl = cust.profile_photo_url ?? undefined;
        }
      }

      if (cancelled) return;
      setRideData({
        rideId: data.id,
        pickupAddress: data.pickup_address,
        dropoffAddress: data.dropoff_address,
        fare: data.fare_amount ?? undefined,
        distance: data.distance_km ?? undefined,
        customerName,
        customerAvatarUrl,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [location.state, navigate, rideData]);

  if (!rideData) return null;

  const handleAccept = async () => {
    if (!driverId) {
      setErrorMsg("Hindi ka naka-login bilang driver. Mag-login muli.");
      return;
    }

    setIsAccepting(true);
    setErrorMsg(null);

    // Optimistic concurrency: only one driver wins. Filter on status='requested'
    // so a ride already accepted by someone else won't be overwritten.
    const { data, error } = await supabase
      .from("rides")
      .update({
        status: "accepted",
        driver_id: driverId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", rideData.rideId)
      .eq("status", "requested")
      .select("id");

    if (error) {
      console.error("Error accepting ride:", error);
      setErrorMsg("May problema sa pagtanggap. Subukan muli.");
      setIsAccepting(false);
      return;
    }

    if (!data || data.length === 0) {
      setErrorMsg("Naunahan ka — kinuha na ng ibang driver.");
      setTimeout(() => navigate("/driver/home"), 1500);
      return;
    }

    navigate("/driver/active", { state: { rideId: rideData.rideId } });
  };

  const handleDecline = () => {
    navigate("/driver/home");
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={handleDecline} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Bagong Booking</h1>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-sm">
          <img src={avatarUrl(rideData.customerName ?? "Pasahero", rideData.customerAvatarUrl)} alt="Customer" className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-800">{rideData.customerName ?? "Pasahero"}</h2>
            <p className="text-xs text-gray-400">Verified Passenger</p>
          </div>
        </div>

        {/* Ride Details */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-[#F47920] rounded-full" />
              <div className="w-0.5 h-8 bg-gray-200" />
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">Pickup</p>
                <p className="text-sm font-semibold text-gray-800">{rideData.pickupAddress}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Dropoff</p>
                <p className="text-sm font-semibold text-gray-800">{rideData.dropoffAddress}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-around pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin className="w-4 h-4 text-[#F47920]" />
              </div>
              <p className="text-xs text-gray-400">Distansya</p>
              <p className="text-sm font-bold text-gray-800">{rideData.distance ? `${rideData.distance.toFixed(1)} km` : "--"}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-[#F47920]" />
              </div>
              <p className="text-xs text-gray-400">Est. Oras</p>
              <p className="text-sm font-bold text-gray-800">{rideData.distance ? `~${Math.max(2, Math.round(rideData.distance * 4))} min` : "--"}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Navigation className="w-4 h-4 text-[#F47920]" />
              </div>
              <p className="text-xs text-gray-400">Bayad</p>
              <p className="text-sm font-bold text-gray-800">₱{rideData.fare ? rideData.fare.toFixed(0) : "--"}</p>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Detalye ng Bayad</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">Base fare</p>
              <p className="text-gray-800">₱40.00</p>
            </div>
            <div className="flex justify-between text-sm">
              <p className="text-gray-500">Distance ({rideData.distance ? `${rideData.distance.toFixed(1)} km` : "--"})</p>
              <p className="text-gray-800">₱{rideData.distance ? (rideData.distance * 15).toFixed(0) : "--"}</p>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <p className="font-bold text-gray-800">Kabuuan</p>
              <p className="font-bold text-[#F47920] text-lg">₱{rideData.fare ? rideData.fare.toFixed(0) : "--"}</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="bg-white px-4 py-4 border-t border-gray-100 gap-3 flex">
        <button
          onClick={handleDecline}
          disabled={isAccepting}
          className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold text-sm"
        >
          Ayaw
        </button>
        <button
          onClick={handleAccept}
          disabled={isAccepting}
          className="flex-1 bg-[#F47920] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          {isAccepting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Tinatanggap...
            </>
          ) : (
            "Tanggapin"
          )}
        </button>
      </div>
    </div>
  );
}
