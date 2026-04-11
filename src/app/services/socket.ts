import { supabase } from '../../lib/supabase';

let driverChannel: any = null;
let customerChannel: any = null;

// ─── Driver socket helpers (using Supabase Database) ──────────────────

export function driverGoOnline(driverId: string, latitude: number, longitude: number) {
  // Update driver status in database
  return supabase
    .from('drivers')
    .update({ 
      is_online: true, 
      current_latitude: latitude, 
      current_longitude: longitude,
      location_updated_at: new Date().toISOString()
    })
    .eq('id', driverId);
}

export function driverGoOffline(driverId: string) {
  // Update driver status in database
  return supabase
    .from('drivers')
    .update({ is_online: false })
    .eq('id', driverId);
}

export function driverUpdateLocation(
  driverId: string,
  latitude: number,
  longitude: number,
) {
  return supabase
    .from('drivers')
    .update({ 
      current_latitude: latitude, 
      current_longitude: longitude,
      location_updated_at: new Date().toISOString()
    })
    .eq('id', driverId);
}

export function driverAcceptRide(driverId: string, rideId: string) {
  // Update ride status
  return supabase
    .from('rides')
    .update({ 
      status: 'accepted',
      driver_id: driverId,
      accepted_at: new Date().toISOString()
    })
    .eq('id', rideId);
}

export function driverStartRide(driverId: string, rideId: string) {
  // Update ride status
  return supabase
    .from('rides')
    .update({ 
      status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .eq('id', rideId);
}

export function driverCompleteRide(driverId: string, rideId: string) {
  // Update ride status
  return supabase
    .from('rides')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', rideId);
}

// ─── Customer socket helpers (using Supabase Database) ─────────────────

export function customerRequestRide(data: {
  customerId: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  pickupAddress: string;
  dropoffAddress: string;
}) {
  // Validate customer ID
  if (!data.customerId || data.customerId === 'temp-id' || data.customerId.length !== 36) {
    console.error('Invalid customer ID:', data.customerId);
    return Promise.reject(new Error('Invalid customer ID. Please log in again.'));
  }

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

  const distanceKm = calculateDistance(
    data.pickupLatitude,
    data.pickupLongitude,
    data.dropoffLatitude,
    data.dropoffLongitude
  );
  const fareAmount = calculateFare(distanceKm);

  // Create ride request with distance and fare
  return supabase
    .from('rides')
    .insert([{
      customer_id: data.customerId,
      pickup_latitude: data.pickupLatitude,
      pickup_longitude: data.pickupLongitude,
      dropoff_latitude: data.dropoffLatitude,
      dropoff_longitude: data.dropoffLongitude,
      pickup_address: data.pickupAddress,
      dropoff_address: data.dropoffAddress,
      distance_km: distanceKm,
      fare_amount: fareAmount,
      status: 'requested'
    }])
    .select()
    .single();
}

export function customerWatchDrivers() {
  // For now, just log that we're watching drivers
  console.log('Watching for driver updates...');
  // TODO: Implement Supabase Realtime subscriptions properly
}

export function customerWatchDriver(driverId: string) {
  // For now, just log that we're watching a specific driver
  console.log(`Watching driver ${driverId}...`);
  // TODO: Implement Supabase Realtime subscriptions properly
}

export function customerLeaveRide(rideId: string) {
  // Unsubscribe from ride updates
  if (customerChannel) {
    supabase.removeChannel(customerChannel);
    customerChannel = null;
  }
}

// ─── Helper functions ───────────────────────────────────────────────

export function disconnectSocket() {
  if (driverChannel) {
    supabase.removeChannel(driverChannel);
    driverChannel = null;
  }
  if (customerChannel) {
    supabase.removeChannel(customerChannel);
    customerChannel = null;
  }
}
