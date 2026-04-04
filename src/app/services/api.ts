import { supabase } from '../../lib/supabase';

function getToken(): string | null {
  return localStorage.getItem("sita_token");
}

export function saveAuth(token: string, user: unknown, role: "user" | "driver" | "admin") {
  localStorage.setItem("sita_token", token);
  localStorage.setItem("sita_user", JSON.stringify(user));
  localStorage.setItem("sita_role", role);
}

export function clearAuth() {
  localStorage.removeItem("sita_token");
  localStorage.removeItem("sita_user");
  localStorage.removeItem("sita_role");
}

export function getStoredUser<T = Record<string, unknown>>(): T | null {
  const raw = localStorage.getItem("sita_user");
  return raw ? (JSON.parse(raw) as T) : null;
}

export function getStoredRole(): "user" | "driver" | "admin" | null {
  return localStorage.getItem("sita_role") as "user" | "driver" | "admin" | null;
}

// ─── Auth ────────────────────────────────────────────────────

export const authApi = {
  customerRegister: async (body: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
  }) => {
    try {
      // Create auth user (phone-only, no email required)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        phone: body.phone,
        password: body.password,
        options: {
          data: {
            first_name: body.firstName,
            last_name: body.lastName,
            phone: body.phone,
            user_type: 'customer'
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('User with this email or phone already exists');
        }
        throw authError;
      }

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user?.id,
          first_name: body.firstName,
          last_name: body.lastName,
          phone: body.phone,
          email: body.email || null,
          password_hash: 'handled_by_supabase_auth'
        }])
        .select()
        .single();

      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error('Phone number or email already registered');
        }
        throw profileError;
      }

      return { success: true, token: authData.session?.access_token || '', user: profileData };
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  customerLogin: async (body: { phone: string; password: string }) => {
    try {
      // Direct login with phone and password (Supabase supports phone auth)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        phone: body.phone,
        password: body.password
      });

      if (authError) throw authError;

      return { success: true, token: authData.session?.access_token || '', user: authData.user };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  driverRegister: async (body: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    plateNumber: string;
    vehicleModel: string;
    vehicleColor: string;
    licenseUrl?: string;
  }) => {
    try {
      // Create auth user (phone-only, no email required)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        phone: body.phone,
        password: body.password,
        options: {
          data: {
            first_name: body.firstName,
            last_name: body.lastName,
            phone: body.phone,
            user_type: 'driver'
          }
        }
      });

      if (authError) throw authError;

      // Create driver profile
      const { data: profileData, error: profileError } = await supabase
        .from('drivers')
        .insert([{
          id: authData.user?.id,
          first_name: body.firstName,
          last_name: body.lastName,
          phone: body.phone,
          email: body.email || null,
          plate_number: body.plateNumber,
          vehicle_model: body.vehicleModel,
          vehicle_color: body.vehicleColor,
          license_url: body.licenseUrl || null,
          password_hash: 'handled_by_supabase_auth'
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      return { success: true, token: authData.session?.access_token || '', driver: profileData };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  driverLogin: async (body: { phone: string; password: string }) => {
    try {
      // Direct login with phone and password (Supabase supports phone auth)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        phone: body.phone,
        password: body.password
      });

      if (authError) throw authError;

      return { success: true, token: authData.session?.access_token || '', driver: authData.user };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  getMe: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      // Check if user or driver
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (userData) {
        return { success: true, data: userData, role: 'user' };
      }

      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (driverData) {
        return { success: true, data: driverData, role: 'driver' };
      }

      throw new Error('User not found');
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
};

// ─── Rides ───────────────────────────────────────────────────

export const ridesApi = {
  get: (rideId: string) => {
    // Get ride from Supabase
    return supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        return { success: true, data };
      });
  },

  create: (body: {
    pickupAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffAddress: string;
    dropoffLatitude: number;
    dropoffLongitude: number;
    paymentMethod?: string;
    customerId?: string;
  }) => {
    // Create ride using customerRequestRide from socket service
    return import('./socket').then(({ customerRequestRide }) => {
      return customerRequestRide({
        customerId: body.customerId || 'temp-id',
        pickupLatitude: body.pickupLatitude,
        pickupLongitude: body.pickupLongitude,
        dropoffLatitude: body.dropoffLatitude,
        dropoffLongitude: body.dropoffLongitude,
        pickupAddress: body.pickupAddress,
        dropoffAddress: body.dropoffAddress,
      });
    });
  },
};

// ─── Types ───────────────────────────────────────────────────

export interface RideData {
  id: string;
  status: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  distance_km: number;
  fare_amount: number;
  payment_method: string;
  driver_id?: string;
  customer_id?: string;
  driver_first_name?: string;
  driver_last_name?: string;
  driver_phone?: string;
  plate_number?: string;
  vehicle_model?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_phone?: string;
}

export interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  wallet_balance: number;
  total_rides: number;
  average_rating: number;
  profile_photo_url?: string;
}

export interface DriverData {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  plate_number: string;
  vehicle_model: string;
  vehicle_color: string;
  verification_status: string;
  is_online: boolean;
  total_rides: number;
  total_earnings: number;
  average_rating: number;
}
