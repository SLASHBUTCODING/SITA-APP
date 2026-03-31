import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SITA API Edge Function
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const path = url.pathname.replace('/api/v1', '')

    // Route handling
    switch (path) {
      case '/health':
        return new Response(
          JSON.stringify({ success: true, message: "SITA API is running", timestamp: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case '/auth/customer/register':
        if (req.method === 'POST') {
          const body = await req.json()
          // Handle customer registration
          const { data, error } = await supabaseClient
            .from('users')
            .insert([{
              first_name: body.firstName,
              last_name: body.lastName,
              phone: body.phone,
              email: body.email,
              password_hash: body.password // Should be hashed
            }])
            .select()
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case '/drivers/available':
        if (req.method === 'GET') {
          const { data, error } = await supabaseClient
            .from('drivers')
            .select('*')
            .eq('is_online', true)
            .not('current_latitude', 'is', null)
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({ success: true, drivers: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case '/rides/request':
        if (req.method === 'POST') {
          const body = await req.json()
          // Handle ride request
          const { data, error } = await supabaseClient
            .from('rides')
            .insert([{
              customer_id: body.customerId,
              pickup_latitude: body.pickupLatitude,
              pickup_longitude: body.pickupLongitude,
              pickup_address: body.pickupAddress,
              dropoff_latitude: body.dropoffLatitude,
              dropoff_longitude: body.dropoffLongitude,
              dropoff_address: body.dropoffAddress,
              status: 'requested',
              fare_amount: body.fareAmount
            }])
            .select()
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({ success: true, ride: data[0] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      default:
        return new Response(
          JSON.stringify({ success: false, message: "Route not found" }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ success: false, message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
