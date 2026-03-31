# 🚀 Render + Supabase Deployment Guide

## Architecture
- **Frontend**: Render (Static Site)
- **Backend**: Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **Live Tracking**: Supabase Realtime

## 🎯 Render Frontend Deployment

### 1. Create render.yaml
```yaml
services:
  # Frontend Static Site
  - type: web
    name: sita-frontend
    env: static
    buildCommand: "npm run build"
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /api/*
        destination: https://your-project-ref.supabase.co/functions/v1/sita-api
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_SUPABASE_URL
        value: https://your-project-ref.supabase.co
      - key: VITE_SUPABASE_ANON_KEY
        value: your-supabase-anon-key
```

### 2. Deploy to Render
```bash
# Connect GitHub repo to Render
# Render will auto-deploy on push
```

## 🔧 Supabase Backend Setup

### 1. Install Supabase CLI
```bash
npm install -g supabase
supabase login
```

### 2. Initialize and Deploy
```bash
supabase init
supabase link --project-ref your-project-ref
supabase functions deploy sita-api
```

## 📱 Live Tracking Integration

### Frontend (React)
```typescript
// src/services/liveTracking.ts
import { RealtimeChannel } from '@supabase/supabase-js'

export class LiveTrackingService {
  private channel: RealtimeChannel

  constructor(supabase: any) {
    // Listen for driver location updates
    this.channel = supabase
      .channel('driver-locations')
      .on('broadcast', { event: 'driver-location' }, (payload) => {
        // Update driver location on map
        this.updateDriverLocation(payload.data)
      })
      .subscribe()
  }

  updateDriverLocation(data: any) {
    // Update map with new driver location
    console.log('Driver location updated:', data)
  }
}
```

### Backend (Supabase Edge Function)
```typescript
// Broadcast driver location updates
await supabaseClient
  .channel('driver-locations')
  .send({
    type: 'broadcast',
    event: 'driver-location',
    payload: { driverId, latitude, longitude }
  })
```

## 🌐 Environment Variables

### Render Environment Variables
- `VITE_SUPABASE_URL` = Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

### Supabase Environment Variables
- `SUPABASE_URL` = Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key

## 🚀 Deployment Steps

### Step 1: Setup Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run database schema
3. Enable Realtime for driver_locations table
4. Deploy Edge Functions

### Step 2: Setup Render
1. Connect GitHub repo to Render
2. Create Static Site service
3. Add environment variables
4. Deploy automatically

### Step 3: Test Integration
1. Frontend loads from Render
2. API calls go to Supabase Edge Functions
3. Live tracking via Supabase Realtime
4. Database operations in Supabase

## 💰 Cost Comparison

### Current Setup: Render + Supabase
- **Render**: Free tier + $7/month (Static Site)
- **Supabase**: Free tier + $20/month (Edge Functions)
- **Total**: ~$27/month

### Previous: Railway
- **Railway**: $20-50/month (after trial)
- **Savings**: $15-23/month!

## 🔧 Render Configuration Files

### render.yaml
```yaml
services:
  - type: web
    name: sita-app
    env: static
    buildCommand: "cd frontend && npm install && npm run build"
    staticPublishPath: ./frontend/dist
    domains:
      - sita.onrender.com
    routes:
      - type: rewrite
        source: /api/*
        destination: https://your-project-ref.supabase.co/functions/v1/sita-api
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
```

### .env.example (Frontend)
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 📊 Benefits of Render + Supabase

✅ **Cost Effective**: ~$27/month vs Railway ~$40/month
✅ **Better Performance**: CDN + Edge Functions
✅ **Real-time Tracking**: Supabase built-in realtime
✅ **Auto-scaling**: Both platforms scale automatically
✅ **Global CDN**: Fast loading worldwide
✅ **SSL Included**: Free SSL certificates
✅ **Custom Domains**: Easy domain setup

## 🚨 Important Notes

1. **Update API URLs** in frontend to point to Supabase Edge Functions
2. **Enable Realtime** on driver_locations table in Supabase
3. **Set CORS** properly in Supabase Edge Functions
4. **Test Live Tracking** after deployment

Your live tracking will work even better with Supabase Realtime!
