import { supabase } from '../../lib/supabase';

let driverChannel: any = null;
let customerChannel: any = null;

// ─── Driver socket helpers (using Supabase Realtime) ──────────────────

export function driverGoOnline(driverId: string, latitude: number, longitude: number) {
  // Update driver status in database
  supabase
    .from('drivers')
    .update({ 
      is_online: true, 
      current_latitude: latitude, 
      current_longitude: longitude,
      location_updated_at: new Date().toISOString()
    })
    .eq('id', driverId);

  // Broadcast to all customers
  supabase
    .channel('driver-updates')
    .send({
      type: 'broadcast',
      event: 'driver-online',
      payload: { driverId, latitude, longitude }
    });
}

export function driverGoOffline(driverId: string) {
  // Update driver status in database
  supabase
    .from('drivers')
    .update({ is_online: false })
    .eq('id', driverId);

  // Broadcast to all customers
  supabase
    .channel('driver-updates')
    .send({
      type: 'broadcast',
      event: 'driver-offline',
      payload: { driverId }
    });
}

export function driverUpdateLocation(
  driverId: string,
  latitude: number,
  longitude: number,
  speed?: number,
  heading?: number
) {
  // Update location in database
  supabase
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

  // Broadcast location update
  supabase
    .channel('driver-locations')
    .send({
      type: 'broadcast',
      event: 'driver-location-update',
      payload: { driverId, latitude, longitude, speed, heading }
    });
}

export function driverAcceptRide(driverId: string, rideId: string) {
  // Update ride status
  supabase
    .from('rides')
    .update({ 
      status: 'accepted',
      driver_id: driverId,
      accepted_at: new Date().toISOString()
    })
    .eq('id', rideId);

  // Broadcast ride update
  supabase
    .channel('ride-updates')
    .send({
      type: 'broadcast',
      event: 'ride-accepted',
      payload: { driverId, rideId }
    });
}

export function driverStartRide(driverId: string, rideId: string) {
  // Update ride status
  supabase
    .from('rides')
    .update({ 
      status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .eq('id', rideId);

  // Broadcast ride update
  supabase
    .channel('ride-updates')
    .send({
      type: 'broadcast',
      event: 'ride-started',
      payload: { driverId, rideId }
    });
}

export function driverCompleteRide(driverId: string, rideId: string) {
  // Update ride status
  supabase
    .from('rides')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', rideId);

  // Broadcast ride update
  supabase
    .channel('ride-updates')
    .send({
      type: 'broadcast',
      event: 'ride-completed',
      payload: { driverId, rideId }
    });
}

// ─── Customer socket helpers (using Supabase Realtime) ─────────────────

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
  supabase
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

  // Broadcast ride request to drivers
  supabase
    .channel('ride-requests')
    .send({
      type: 'broadcast',
      event: 'ride-requested',
      payload: data
    });
}

export function customerWatchDrivers() {
  // Subscribe to driver updates
  driverChannel = supabase
    .channel('driver-updates')
    .on('broadcast', { event: 'driver-online' }, (payload: any) => {
      // Handle driver coming online
      console.log('Driver online:', payload.payload);
    })
    .on('broadcast', { event: 'driver-offline' }, (payload: any) => {
      // Handle driver going offline
      console.log('Driver offline:', payload.payload);
    })
    .on('broadcast', { event: 'driver-location-update' }, (payload: any) => {
      // Handle driver location updates
      console.log('Driver location update:', payload.payload);
    })
    .subscribe();
}

export function customerWatchDriver(driverId: string) {
  // Subscribe to specific driver updates
  customerChannel = supabase
    .channel(`driver-${driverId}`)
    .on('broadcast', { event: 'driver-location-update' }, (payload: any) => {
      // Handle specific driver location updates
      console.log(`Driver ${driverId} location:`, payload.payload);
    })
    .subscribe();
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
