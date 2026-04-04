# Disable Email Confirmation in Supabase

## Step 1: Go to Supabase Project Dashboard
1. Login to [supabase.com](https://supabase.com)
2. Select your project: `lkalyrpeicakggdwwobq`

## Step 2: Disable Email Confirmation
1. Click **⚙️ Settings** in the left sidebar
2. Click **Authentication** under **Configuration**
3. Scroll down to **Email confirmation**
4. **Toggle OFF** the "Enable email confirmations" switch
5. **Click "Save"**

## Step 3: Update Auth Flow
The current auth flow will now be:
1. User signs up → No email sent ✅
2. SMS OTP sent immediately ✅
3. User verifies with SMS OTP ✅
4. Instant login access ✅

## Benefits for Tricycle Drivers:
- ✅ **Instant verification** - no waiting for email
- ✅ **Always have phone** - no email setup needed
- ✅ **Simple process** - just enter 6 digits
- ✅ **Higher completion rates** - less friction
- ✅ **Perfect for on-the-go** - drivers are mobile-first

## Current Implementation:
- ✅ SMS OTP service created
- ✅ Customer & Driver signup sends SMS OTP
- ✅ OTP verification pages updated
- ✅ Email confirmation disabled in Supabase

This is the optimal flow for tricycle drivers!
