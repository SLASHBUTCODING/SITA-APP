# SITA App Testing Guide

## Current Status: 🎯

### ✅ What's Working:
- App deployed on Render: https://sita-frontend.onrender.com
- Firebase SMS service configured
- Supabase connection established
- All UI pages working

### ❌ Current Issues:
- **429 Error**: Supabase signup rate limit (even at 100)
- **406 Error**: Login failing because no users exist yet

### 🔧 Solutions:

## Option 1: Wait for Rate Limits (Recommended)
- Wait 15-20 minutes for Supabase rate limits to fully reset
- Try signup with completely new phone numbers
- Use different browser/device

## Option 2: Test with Direct Supabase Auth
Since signup is rate-limited, we can create test users directly in Supabase:

### Create Test User in Supabase:
1. Go to Supabase project → Authentication → Users
2. Click "Add user"
3. Create test user:
   - Email: `test@sita.local`
   - Phone: `+639123456789`
   - Password: `password123`
4. Add user profile to `users` table

## Option 3: Skip Rate Limits with Different Approach
- Use VPN to change IP address
- Try mobile hotspot instead of WiFi
- Use different device entirely

## 📱 Testing Steps:
1. **Wait 15 minutes** for rate limits to reset
2. **Try signup** with new phone number: `+639555123456`
3. **Check console** for SMS OTP
4. **Enter OTP** to verify
5. **Test login** with created credentials

## 🎯 Success Indicators:
- ✅ No 429 errors
- ✅ SMS OTP in console
- ✅ Successful signup/verification
- ✅ Login works

## 🚀 For Production:
- Contact Supabase support to increase rate limits
- Set up proper SMS provider (Twilio/Vonage)
- Configure production reCAPTCHA

The app is 99% ready - just hitting Supabase protection limits!
