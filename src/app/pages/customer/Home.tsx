import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, ChevronRight, Bell, Navigation, Clock, X } from "lucide-react";
import { SITAMap } from "../../components/SITAMap";
import { watchNearbyDrivers } from "../../../services/realtimeTracking";
import { CustomerNav } from "../../components/CustomerNav";
import { getStoredUser, ridesApi, type UserData, type RideData } from "../../services/api";

const QUICK_DESTINATIONS = [
  { icon: "🏠", label: "Home", address: "Blk 5 Lot 12, Brgy. San Jose" },
  { icon: "💼", label: "Work", address: "Municipal Hall, Poblacion" },
  { icon: "🏥", label: "Health Center", address: "Brgy. Health Center, Purok 3" },
  { icon: "🛒", label: "Palengke", address: "Public Market, Poblacion" },
];

const RECENT = [
  { place: "Covered Court, Brgy. Sta. Cruz", address: "Purok 2, Sta. Cruz" },
  { place: "Elementary School", address: "Brgy. San Roque, Purok 1" },
];

const DEFAULT_MARKERS = [
  { x: 50, y: 56, type: "pickup" as const },
  { x: 32, y: 38, type: "driver" as const },
  { x: 68, y: 74, type: "driver2" as const },
  { x: 15, y: 56, type: "driver3" as const },
];

const CUSTOMER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";

export function CustomerHome() {
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [pickup, setPickup] = useState("Current Location");
  const [dropoff, setDropoff] = useState("");
  const [activeField, setActiveField] = useState<"pickup" | "dropoff">("dropoff");
  const [nearbyCount, setNearbyCount] = useState(0);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<{id: string; lat: number; lng: number; name: string}[]>([]);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{display_name: string; lat: string; lon: string}>>([]);
  const [destinationCoords, setDestinationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);

  const user = getStoredUser<UserData>();
  const displayName = user ? `${user.first_name} ${user.last_name}` : "Pasahero";

  useEffect(() => {
    // Watch nearby drivers with real-time updates
    const cleanup = watchNearbyDrivers((drivers) => {
      setNearbyDrivers(drivers);
      setNearbyCount(drivers.length);
    });
    
    // Get current location on mount
    getCurrentLocation();
    
    return cleanup;
  }, []);

  const handleDestinationSelect = (address: string, coords?: {lat: number, lng: number}) => {
    console.log('handleDestinationSelect called:', { address, coords, activeField });
    
    if (activeField === "pickup") {
      setPickup(address);
    } else {
      setDropoff(address);
    }
    
    if (coords) {
      setDestinationCoords(coords);
      
      // Calculate distance and fare if we have current location
      if (currentCoords) {
        const distance = calculateDistance(
          currentCoords.lat, currentCoords.lng,
          coords.lat, coords.lng
        );
        const fare = calculateFare(distance);
        setEstimatedFare(fare);
        console.log('Distance calculated:', distance, 'Fare:', fare);
        
        // Create simple route (straight line for now)
        setRouteCoords([
          [currentCoords.lat, currentCoords.lng],
          [coords.lat, coords.lng]
        ]);
      } else {
        console.log('No current coords for distance calculation');
      }
    } else {
      console.log('No coordinates provided for destination');
    }
    
    setSearchFocused(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearchResultSelect = (result: {display_name: string; lat: string; lon: string}) => {
    const coords = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    handleDestinationSelect(result.display_name, coords);
  };

  const handlePresetSelect = (label: string, address: string) => {
    // For presets, we can use approximate coordinates or geocode them
    // For now, just set the address
    handleDestinationSelect(address);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      searchLocations(searchQuery.trim());
    }
  };

  // Search locations using Nominatim API
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=ph&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Calculate estimated fare based on distance
  const calculateFare = (distanceKm: number) => {
    const baseFare = 40; // Base fare in PHP
    const perKmRate = 15; // Rate per kilometer
    return Math.round(baseFare + (distanceKm * perKmRate));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setBookError("Location not supported on this device.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentCoords(coords);
        setPickup("Current Location (GPS)");
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        // iOS/Android compatible error codes: 1=denied, 2=unavailable, 3=timeout
        if (error.code === 1) {
          setBookError("Location access denied. Please allow location in your phone settings.");
        } else if (error.code === 2) {
          setBookError("Location unavailable. Please check your GPS signal.");
        } else {
          setBookError("Location request timed out. Try again.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000  // Accept 30s cached position - better for iOS battery
      }
    );
  };

  const handleBookNow = async () => {
    if (!dropoff || booking) return;
    setBookError("");
    setBooking(true);
    try {
      const res = await ridesApi.create({
        pickupAddress: pickup,
        pickupLatitude: 14.5995,
        pickupLongitude: 120.9842,
        dropoffAddress: dropoff,
        dropoffLatitude: 14.6010,
        dropoffLongitude: 120.9870,
        paymentMethod: "cash",
      });
      const ride = (res as any)?.data as RideData;
      navigate("/customer/finding", { state: { rideId: ride.id, pickup, dropoff } });
    } catch (err) {
      setBookError(err instanceof Error ? err.message : "Booking failed");
      setBooking(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Map Container - Fixed 42% height */}
      <div className="h-[42vh] flex-shrink-0 relative overflow-hidden">
        <SITAMap
          customerLocation={currentCoords ? [currentCoords.lat, currentCoords.lng] : undefined}
          nearbyDrivers={nearbyDrivers}
          destinationLocation={destinationCoords ? [destinationCoords.lat, destinationCoords.lng] : undefined}
          routeCoordinates={routeCoords}
          zoom={17}
          className="w-full h-full"
        />
        
        {/* TOP-LEFT OVERLAY — Greeting + Name */}
        <div className="absolute top-4 left-4 z-[1000]">
          <p className="text-sm text-gray-600">Magandang umaga 👋</p>
          <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl shadow-sm mt-1">
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
          </div>
        </div>

        {/* BOTTOM-LEFT OVERLAY — Tricycles nearby pill */}
        <div className="absolute bottom-4 left-4 z-[1000]">
          <div className="bg-white rounded-full px-4 py-2 shadow-md flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-700 font-medium">4 tricycles nearby · ~3 min ETA</span>
          </div>
        </div>

        {/* TOP-RIGHT OVERLAY — Location label */}
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="bg-white rounded-full px-3 py-1 shadow-sm flex items-center gap-1">
            <MapPin className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-gray-600">Iyong Lokasyon</span>
          </div>
        </div>
      </div>

      {/* Booking Panel */}
      <div className="flex-1 overflow-y-auto pb-16">
        {/* Bottom Booking Sheet */}
        <AnimatePresence>
          {!searchFocused ? (
            <motion.div
              key="collapsed"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="relative z-10 bg-white rounded-t-3xl shadow-2xl px-4 pt-4"
            >
              <div 
                className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3 cursor-pointer"
                onClick={() => setIsPanelMinimized(!isPanelMinimized)}
              />
              {!isPanelMinimized && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-gray-800 font-bold text-base">Saan tayo?</h2>
                    <div className="bg-[#F47920]/10 rounded-full px-2.5 py-1">
                      <span className="text-[#F47920] text-xs font-semibold">🛺 Tricycle</span>
                    </div>
                  </div>

                  {/* Pickup */}
                  <div
                    className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 mb-2 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => { 
                      console.log('Pickup field clicked, current pickup:', pickup);
                      if (pickup === "Current Location") {
                        console.log('Getting current location...');
                        getCurrentLocation();
                      } else {
                        console.log('Setting pickup field active...');
                        setActiveField("pickup"); 
                        setSearchFocused(true); 
                      }
                    }}
                  >
                    <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow" />
                    <span className="flex-1 text-sm text-gray-700 truncate">
                      {pickup === "Current Location" && locationLoading ? "Getting location..." : pickup}
                    </span>
                    <Navigation className="w-3.5 h-3.5 text-[#F47920]" />
                  </div>

                  {/* Dropoff */}
                  <div
                    className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 mb-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => { 
                      console.log('Dropoff field clicked');
                      setActiveField("dropoff"); 
                      setSearchFocused(true); 
                    }}
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#F47920]" />
                    <span className={`flex-1 text-sm truncate ${dropoff ? "text-gray-700" : "text-gray-400"}`}>
                      {dropoff || "Saan pupunta?"}
                    </span>
                    {dropoff && (
                      <button onClick={(e) => { 
                        e.stopPropagation(); 
                        console.log('Clearing dropoff');
                        setDropoff(""); 
                        setDestinationCoords(null);
                        setRouteCoords([]);
                        setEstimatedFare(0);
                      }}>
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Quick destinations */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {QUICK_DESTINATIONS.map((dest) => (
                      <button
                        key={dest.label}
                        onClick={() => { 
                          console.log('Quick destination clicked:', dest.label, dest.address);
                          setActiveField("dropoff"); 
                          // For now, just set address without coordinates
                          // In a real app, you'd geocode these addresses
                          handleDestinationSelect(dest.address); 
                        }}
                        className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-left hover:bg-orange-50 transition-colors border border-gray-100"
                      >
                        <span className="text-base">{dest.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{dest.label}</p>
                          <p className="text-[10px] text-gray-400 truncate">{dest.address.split(",")[0]}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Estimated Fare */}
                  {estimatedFare > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estimated fare:</span>
                        <span className="text-lg font-bold text-[#F47920]">₱{estimatedFare}</span>
                      </div>
                    </div>
                  )}

                  {bookError && (
                    <p className="text-red-500 text-xs text-center mb-2">{bookError}</p>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBookNow}
                    disabled={!dropoff || booking}
                    className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all ${dropoff && !booking ? "bg-[#F47920] text-white shadow-lg shadow-orange-200" : "bg-gray-100 text-gray-400"}`}
                  >
                    {booking ? "Nagbo-book..." : dropoff ? "Mag-Book ng Tricycle" : "Pumili ng Destinasyon"}
                  </motion.button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute inset-0 z-20 bg-white flex flex-col"
            >
              <div className="pt-12 px-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <button onClick={() => setSearchFocused(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                  <h2 className="font-bold text-gray-800">{activeField === "pickup" ? "Set Pickup" : "Piliin ang Destinasyon"}</h2>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 border border-[#F47920] rounded-xl px-3 py-2.5">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchLocations(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                    placeholder={activeField === "pickup" ? "Pickup location..." : "Search destination..."}
                    className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="px-4 pt-4 flex-1 overflow-auto">
                {/* Search Results */}
                {searchLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F47920]"></div>
                  </div>
                )}
                
                {searchResults.length > 0 && (
                  <>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Search Results</p>
                    {searchResults.map((result, index) => (
                      <button 
                        key={index} 
                        onClick={() => handleSearchResultSelect(result)} 
                        className="w-full flex items-center gap-3 py-3 border-b border-gray-50"
                      >
                        <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-[#F47920]" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-semibold text-gray-800">{result.display_name.split(',')[0]}</p>
                          <p className="text-xs text-gray-400">{result.display_name.split(',').slice(1).join(',').trim()}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </button>
                    ))}
                  </>
                )}

                {/* Recent */}
                {!searchLoading && searchResults.length === 0 && (
                  <>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Recent</p>
                    {RECENT.map((r, i) => (
                      <button key={i} onClick={() => handleDestinationSelect(r.place)} className="w-full flex items-center gap-3 py-3 border-b border-gray-50">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-800">{r.place}</p>
                          <p className="text-xs text-gray-400">{r.address}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                      </button>
                    ))}

                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-4 mb-3">Mga Lugar</p>
                    {QUICK_DESTINATIONS.map((d) => (
                      <button key={d.label} onClick={() => handleDestinationSelect(d.address)} className="w-full flex items-center gap-3 py-3 border-b border-gray-50">
                        <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">{d.icon}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-800">{d.label}</p>
                          <p className="text-xs text-gray-400">{d.address}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav - always at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <CustomerNav />
      </div>
    </div>
  );
}