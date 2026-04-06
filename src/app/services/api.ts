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

// ─── Email OTP ───────────────────────────────────────────────

export async function sendEmailOTP(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  });
  if (error) throw new Error(error.message);
}

export async function verifyEmailOTP(email: string, token: string): Promise<boolean> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });
  if (error) return false;
  return true;
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
      const emailToUse = body.email || `${body.phone}@sita.local`;

      if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        throw new Error('Please enter a valid email address.');
      }
      if (body.password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      if (!body.phone || !/^09\d{9}$/.test(body.phone)) {
        throw new Error('Please enter a valid Philippine mobile number (09XXXXXXXXX).');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailToUse,
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
          throw new Error('Email already registered. Please log in instead.');
        }
        throw authError;
      }

      // If Supabase returns no session after signUp, the email is already confirmed/exists
      if (!authData.user) {
        throw new Error('Email already registered. Please log in instead.');
      }

      // Check if profile already exists before inserting
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      let profileData;
      if (existingProfile) {
        // Profile already exists, fetch it
        const { data: fetchedProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        profileData = fetchedProfile;
      } else {
        // Create user profile
        const { data: insertedProfile, error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
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
            throw new Error('Phone number or email already registered. Please log in instead.');
          }
          throw profileError;
        }
        profileData = insertedProfile;
      }

      // Force sign-in immediately after register (bypasses email confirmation requirement)
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: body.password,
      });

      const token = signInData?.session?.access_token || authData.session?.access_token || '';
      localStorage.setItem('sita_user', JSON.stringify(profileData));
      localStorage.setItem('sita_role', 'user');
      return { success: true, token, user: profileData };
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  customerLogin: async (body: { phone: string; password: string }) => {
    try {
      // Try email derived from phone first (avoids extra DB lookup)
      const derivedEmail = `${body.phone}@sita.local`;

      // Attempt sign-in with derived email first
      let authData: any = null;
      let authError: any = null;

      const attempt1 = await supabase.auth.signInWithPassword({
        email: derivedEmail,
        password: body.password
      });

      if (attempt1.error) {
        // Fallback: look up real email from DB
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('phone', body.phone)
          .maybeSingle();

        if (userError || !userData?.email) {
          throw new Error('User not found. Please sign up first.');
        }

        const attempt2 = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: body.password
        });
        authData = attempt2.data;
        authError = attempt2.error;
      } else {
        authData = attempt1.data;
      }

      if (authError) {
        if (authError.message?.includes('rate')) throw new Error('Too many login attempts. Please wait a few minutes.');
        if (authError.message?.includes('Email not confirmed')) throw new Error('Account setup incomplete. Please sign up again.');
        throw authError;
      }

      // Fetch and cache full user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('phone', body.phone)
        .maybeSingle();

      const user = profile || authData.user;
      localStorage.setItem('sita_user', JSON.stringify(user));
      localStorage.setItem('sita_role', 'user');
      return { success: true, token: authData.session?.access_token || '', user };
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
      const emailToUse = body.email || `${body.phone}@sita.local`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailToUse,
        password: body.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            first_name: body.firstName,
            last_name: body.lastName,
            phone: body.phone,
            user_type: 'driver'
          }
        }
      });

      if (authError) throw authError;

      // Create driver profile with pending verification - must be approved by Admin
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
          password_hash: 'handled_by_supabase_auth',
          verification_status: 'pending'
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // Force sign-in immediately after register (bypasses email confirmation requirement)
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: body.password,
      });

      const token = signInData?.session?.access_token || authData.session?.access_token || '';
      localStorage.setItem('sita_user', JSON.stringify(profileData));
      localStorage.setItem('sita_role', 'driver');
      return { success: true, token, driver: profileData };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  driverLogin: async (body: { phone: string; password: string }) => {
    try {
      const derivedEmail = `${body.phone}@sita.local`;

      let authData: any = null;
      let authError: any = null;

      const attempt1 = await supabase.auth.signInWithPassword({
        email: derivedEmail,
        password: body.password
      });

      if (attempt1.error) {
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('email')
          .eq('phone', body.phone)
          .single();

        if (driverError || !driverData?.email) {
          throw new Error('Driver not found. Please sign up first.');
        }

        const attempt2 = await supabase.auth.signInWithPassword({
          email: driverData.email,
          password: body.password
        });
        authData = attempt2.data;
        authError = attempt2.error;
      } else {
        authData = attempt1.data;
      }

      if (authError) {
        if (authError.message?.includes('rate')) throw new Error('Too many login attempts. Please wait a few minutes.');
        if (authError.message?.includes('Email not confirmed')) throw new Error('Account setup incomplete. Please sign up again.');
        throw authError;
      }

      // Fetch and cache full driver profile
      const { data: profile } = await supabase
        .from('drivers')
        .select('*')
        .eq('phone', body.phone)
        .single();

      const driver = profile || authData.user;

      // Block login if not yet verified by Admin
      if (profile && profile.verification_status !== 'verified') {
        await supabase.auth.signOut();
        if (profile.verification_status === 'rejected') {
          throw new Error('Your application was rejected. Please contact support.');
        }
        throw new Error('Your account is pending admin verification. Please wait for approval.');
      }

      localStorage.setItem('sita_user', JSON.stringify(driver));
      localStorage.setItem('sita_role', 'driver');
      return { success: true, token: authData.session?.access_token || '', driver };
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  getMe: async () => {
    try {
      // Use cached user from localStorage first - avoids unnecessary DB calls
      const cached = localStorage.getItem('sita_user');
      const role = localStorage.getItem('sita_role');
      if (cached && role) {
        return { success: true, data: JSON.parse(cached), role };
      }

      // Fallback: fetch from Supabase auth
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      const storedRole = localStorage.getItem('sita_role');
      const table = storedRole === 'driver' ? 'drivers' : 'users';

      const { data: profileData, error: profileError } = await supabase
        .from(table)
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError || !profileData) throw new Error('User not found');

      // Cache result
      localStorage.setItem('sita_user', JSON.stringify(profileData));
      return { success: true, data: profileData, role: storedRole || 'user' };
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
