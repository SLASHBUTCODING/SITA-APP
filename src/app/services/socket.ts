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
  speed?: number,
  heading?: number
) {
  // Update location in database
  const locationUpdate = supabase
    .from('drivers')
    .update({ 
      current_latitude: latitude, 
      current_longitude: longitude,
      location_updated_at: new Date().toISOString()
    })
    .eq('id', driverId);

  // Add to location history
  supabase
    .from('driver_locations')
    .insert([{
      driver_id: driverId,
      latitude,
      longitude,
      speed: speed || null,
      heading: heading || null
    }]);

  return locationUpdate;
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
  // Create ride request
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
      status: 'requested'
    }]);
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
