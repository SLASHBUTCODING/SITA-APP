import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Clock, X, Navigation } from "lucide-react";
import { driverAcceptRide } from "../../services/socket";

const DRIVER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";

export function DriverRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAccepting, setIsAccepting] = useState(false);

  const rideData = location.state as {
    rideId: string;
    pickupAddress: string;
    dropoffAddress: string;
    fare?: number;
    distance?: number;
  } | null;

  useEffect(() => {
    if (!rideData) {
      navigate("/driver/home");
    }
  }, [rideData, navigate]);

  if (!rideData) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const driver = JSON.parse(localStorage.getItem('sita_driver') || '{}');
      const driverId = driver.id;

      await driverAcceptRide(driverId, rideData.rideId);
      navigate("/driver/ride-active", { state: { rideId: rideData.rideId } });
    } catch (error) {
      console.error("Error accepting ride:", error);
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    navigate("/driver/home");
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
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
          <img src={DRIVER_IMAGE} alt="Customer" className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-800">Pasahero</h2>
            <p className="text-xs text-gray-400">4.8 ★ · 12 na sakay</p>
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
              <p className="text-sm font-bold text-gray-800">~8 min</p>
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
