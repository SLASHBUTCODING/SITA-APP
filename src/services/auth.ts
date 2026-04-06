// src/services/auth.ts
import { supabase } from '../lib/supabase'

// Customer Registration
export const registerCustomer = async (userData: {
  firstName: string
  lastName: string
  phone: string
  email?: string
  password: string
}) => {
  try {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email || `${userData.phone}@sita.local`,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          user_type: 'customer'
        }
      }
    })

    if (authError) throw authError

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authData.user?.id,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        email: userData.email || null,
        password_hash: 'handled_by_supabase_auth'
      }])
      .select()
      .maybeSingle()

    if (profileError) throw profileError

    return { success: true, user: profileData }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Customer Login
export const loginCustomer = async (credentials: {
  phone: string
  password: string
}) => {
  try {
    // Find user by phone
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('phone', credentials.phone)
      .maybeSingle()

    if (userError || !userData) {
      throw new Error('User not found')
    }

    // Sign in with email
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email || `${credentials.phone}@sita.local`,
      password: credentials.password
    })

    if (authError) throw authError

    return { success: true, session: authData.session }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get Current User
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle()

    if (profileError) throw profileError

    return { success: true, user: profile }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Logout
export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
