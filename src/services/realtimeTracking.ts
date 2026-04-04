// Real-time driver tracking service using Supabase Realtime
import { supabase } from '../lib/supabase';

// ─── Throttle helper ──────────────────────────────────────────
function throttle<T extends (...args: any[]) => any>(fn: T, limitMs: number): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= limitMs) {
      lastCall = now;
      return fn(...args);
    }
  }) as T;
}

// ─── Update driver location (throttled - max 1 write per 10s) ─
const _updateDriverLocation = async (
  driverId: string,
  lat: number,
  lng: number,
) => {
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
};

export const updateDriverLocation = throttle(_updateDriverLocation, 10000);

// ─── Watch a specific driver's location (for customer during ride) ─
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

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Watch nearby online drivers (debounced - max 1 refetch per 15s) ─
export function watchNearbyDrivers(
  onUpdate: (drivers: { id: string; lat: number; lng: number; name: string }[]) => void
) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

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

  // Initial fetch
  fetchOnlineDrivers();

  const channel = supabase
    .channel('nearby-drivers')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'drivers',
      },
      () => {
        // Debounce: only re-fetch after 15s of inactivity to prevent hammering
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchOnlineDrivers, 15000);
      }
    )
    .subscribe();

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    supabase.removeChannel(channel);
  };
}

// ─── Watch ride status changes ────────────────────────────────
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
        if (ride.driver_id) {
          const { data: driver } = await supabase
            .from('drivers')
            .select('current_latitude, current_longitude')
            .eq('id', ride.driver_id)
            .single();

          onUpdate(ride.status, driver?.current_latitude, driver?.current_longitude);
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

// ─── Continuous GPS tracking for driver (throttled to 1 update per 10s) ─
export function startDriverLocationUpdates(
  driverId: string,
  onLocationUpdate?: (lat: number, lng: number) => void
) {
  let watchId: number | null = null;
  let lastLat: number | null = null;
  let lastLng: number | null = null;

  if (!navigator.geolocation) {
    console.warn('Geolocation not supported');
    return () => {};
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude: lat, longitude: lng } = position.coords;

      // Only update if moved more than ~10 meters (avoid micro-updates)
      const moved =
        lastLat === null ||
        Math.abs(lat - lastLat) > 0.0001 ||
        Math.abs(lng - lastLng!) > 0.0001;

      if (moved) {
        lastLat = lat;
        lastLng = lng;
        updateDriverLocation(driverId, lat, lng); // already throttled to 10s
        if (onLocationUpdate) onLocationUpdate(lat, lng);
      }
    },
    (error) => {
      console.error('Geolocation error:', error.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    }
  );

  return () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
}
