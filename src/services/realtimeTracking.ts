// Real-time driver tracking service using Supabase Realtime
import { supabase } from '../lib/supabase';

export interface DriverLocation {
  id: string;
  driver_id: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updated_at: string;
}

// Update driver location in Supabase (called continuously while driving)
export async function updateDriverLocation(
  driverId: string,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number
) {
  const { error } = await supabase
    .from('drivers')
    .update({
      current_latitude: lat,
      current_longitude: lng,
      location_updated_at: new Date().toISOString(),
    })
    .eq('id', driverId);

  if (error) console.error('Error updating driver location:', error);
  return !error;
}

// Watch a specific driver's location (for customer during ride)
export function watchDriverLocation(
  driverId: string,
  onUpdate: (lat: number, lng: number) => void
) {
  const channel = supabase
    .channel(`driver-location-${driverId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'drivers',
        filter: `id=eq.${driverId}`,
      },
      (payload: any) => {
        const driver = payload.new;
        if (driver.current_latitude && driver.current_longitude) {
          onUpdate(driver.current_latitude, driver.current_longitude);
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

// Watch all nearby online drivers (for customer home)
export function watchNearbyDrivers(
  onUpdate: (drivers: { id: string; lat: number; lng: number; name: string }[]) => void
) {
  // Initial fetch of online drivers
  const fetchOnlineDrivers = async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, current_latitude, current_longitude')
      .eq('is_online', true)
      .not('current_latitude', 'is', null);

    if (!error && data) {
      onUpdate(
        data.map((d: any) => ({
          id: d.id,
          lat: d.current_latitude,
          lng: d.current_longitude,
          name: `${d.first_name} ${d.last_name}`,
        }))
      );
    }
  };

  fetchOnlineDrivers();

  // Subscribe to real-time updates
  const channel = supabase
    .channel('nearby-drivers')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'drivers',
      },
      () => {
        // Re-fetch on any driver change
        fetchOnlineDrivers();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Watch ride status changes
export function watchRideStatus(
  rideId: string,
  onUpdate: (status: string, driverLat?: number, driverLng?: number) => void
) {
  const channel = supabase
    .channel(`ride-status-${rideId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides',
        filter: `id=eq.${rideId}`,
      },
      async (payload: any) => {
        const ride = payload.new;
        // If ride has a driver, also get driver location
        if (ride.driver_id) {
          const { data: driver } = await supabase
            .from('drivers')
            .select('current_latitude, current_longitude')
            .eq('id', ride.driver_id)
            .single();

          onUpdate(
            ride.status,
            driver?.current_latitude,
            driver?.current_longitude
          );
        } else {
          onUpdate(ride.status);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Start continuous location updates for driver (every 5 seconds)
export function startDriverLocationUpdates(
  driverId: string,
  onLocationUpdate?: (lat: number, lng: number) => void
) {
  let watchId: number | null = null;

  if (!navigator.geolocation) {
    console.warn('Geolocation not supported');
    return () => {};
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude: lat, longitude: lng, heading, speed } = position.coords;
      updateDriverLocation(driverId, lat, lng, heading || undefined, speed || undefined);
      if (onLocationUpdate) onLocationUpdate(lat, lng);
      console.log(`📍 Driver location updated: ${lat}, ${lng}`);
    },
    (error) => {
      console.error('Geolocation error:', error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    }
  );

  // Return cleanup function
  return () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}
