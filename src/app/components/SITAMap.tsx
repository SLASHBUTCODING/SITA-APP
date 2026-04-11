import { useEffect, useRef } from "react";
import type { FC } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons
const customerIcon = L.divIcon({
  html: `<div style="
    background: #F47920;
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="transform: rotate(45deg); font-size: 16px;">👤</div>
  </div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const driverIcon = L.divIcon({
  html: `<div style="
    background: #1a1a2e;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid #F47920;
    box-shadow: 0 2px 12px rgba(244,121,32,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  ">🛺</div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const pickupIcon = L.divIcon({
  html: `<div style="
    background: #22c55e;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const dropoffIcon = L.divIcon({
  html: `<div style="
    background: #ef4444;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export interface DriverMarker {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  isOnline?: boolean;
}

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  customerLocation?: [number, number];
  driverLocation?: [number, number];
  pickupLocation?: [number, number];
  dropoffLocation?: [number, number];
  destinationLocation?: [number, number];
  routeCoordinates?: Array<[number, number]>;
  nearbyDrivers?: DriverMarker[];
  showRoute?: boolean;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

export function SITAMap({
  center,
  zoom = 17,
  customerLocation,
  driverLocation,
  pickupLocation,
  dropoffLocation,
  destinationLocation,
  routeCoordinates,
  nearbyDrivers = [],
  showRoute = false,
  className = "",
  onMapClick,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const routeRef = useRef<L.Polyline | null>(null);

  // Default center: Use actual GPS location or Philippines center as last resort
  const defaultCenter: [number, number] = customerLocation || center || driverLocation || [12.8797, 121.7740]; // Philippines center

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom,
      zoomControl: false,
      attributionControl: false,
      touchZoom: true,
      scrollWheelZoom: false,
    });

    // OpenStreetMap tiles (reliable, free)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      subdomains: "abc",
      maxZoom: 19,
    }).addTo(map);

    // Small attribution
    L.control.attribution({ prefix: "© OSM" }).addTo(map);

    // Click handler
    if (onMapClick) {
      map.on("click", (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    // Invalidate size after mount so Leaflet recalculates container dimensions
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update customer marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (customerLocation) {
      if (markersRef.current["customer"]) {
        markersRef.current["customer"].setLatLng(customerLocation);
      } else {
        markersRef.current["customer"] = L.marker(customerLocation, { icon: customerIcon })
          .addTo(map)
          .bindPopup("📍 Iyong lokasyon");
      }
      map.setView(customerLocation, zoom);
    }
  }, [customerLocation]);

  // Update driver marker (real-time movement)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (driverLocation) {
      if (markersRef.current["driver"]) {
        // Smoothly animate driver marker movement
        markersRef.current["driver"].setLatLng(driverLocation);
      } else {
        markersRef.current["driver"] = L.marker(driverLocation, { icon: driverIcon })
          .addTo(map)
          .bindPopup("🛺 Driver");
      }
    } else {
      if (markersRef.current["driver"]) {
        markersRef.current["driver"].remove();
        delete markersRef.current["driver"];
      }
    }
  }, [driverLocation]);

  // Update destination marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (destinationLocation) {
      if (markersRef.current["destination"]) {
        markersRef.current["destination"].setLatLng(destinationLocation);
      } else {
        markersRef.current["destination"] = L.marker(destinationLocation, { icon: pickupIcon })
          .addTo(map)
          .bindPopup("🎯 Destination");
      }
    } else {
      if (markersRef.current["destination"]) {
        markersRef.current["destination"].remove();
        delete markersRef.current["destination"];
      }
    }
  }, [destinationLocation]);

  // Update route line
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove existing route
    if (routeRef.current) {
      routeRef.current.remove();
      routeRef.current = null;
    }

    // Add new route if coordinates provided
    if (routeCoordinates && routeCoordinates.length >= 2) {
      routeRef.current = L.polyline(routeCoordinates, {
        color: "#F47920",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 5"
      }).addTo(map);

      // Fit map to show route
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeCoordinates]);

  // Update dropoff marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (dropoffLocation) {
      if (markersRef.current["dropoff"]) {
        markersRef.current["dropoff"].setLatLng(dropoffLocation);
      } else {
        markersRef.current["dropoff"] = L.marker(dropoffLocation, { icon: dropoffIcon })
          .addTo(map)
          .bindPopup("🔴 Dropoff");
      }
    }
  }, [dropoffLocation]);

  // Draw route between two points
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (showRoute && driverLocation && (pickupLocation || customerLocation)) {
      const destination = pickupLocation || customerLocation!;

      // Remove existing route
      if (routeRef.current) {
        routeRef.current.remove();
      }

      // Draw simple straight line route (dashed orange)
      routeRef.current = L.polyline([driverLocation, destination], {
        color: "#F47920",
        weight: 4,
        opacity: 0.8,
        dashArray: "10, 10",
      }).addTo(map);

      // Fit map to show both points
      const bounds = L.latLngBounds([driverLocation, destination]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (routeRef.current) {
      routeRef.current.remove();
      routeRef.current = null;
    }
  }, [showRoute, driverLocation, pickupLocation, customerLocation]);

  // Update nearby driver markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove old nearby driver markers
    Object.keys(markersRef.current).forEach((key) => {
      if (key.startsWith("nearby_")) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }
    });

    // Add new nearby driver markers
    nearbyDrivers.forEach((driver) => {
      const key = `nearby_${driver.id}`;
      markersRef.current[key] = L.marker([driver.lat, driver.lng], { icon: driverIcon })
        .addTo(map)
        .bindPopup(`🛺 ${driver.name || "Driver"}`);
    });
  }, [nearbyDrivers]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full ${className}`}
      style={{ height: "100%", minHeight: "300px" }}
    />
  );
}
