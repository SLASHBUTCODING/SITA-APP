# 🚀 SITA App Deployment Guide

## Railway Deployment (Recommended)

### 1. Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from project root
railway up
```

### 2. Set Environment Variables in Railway Dashboard
Go to your Railway project → Settings → Variables and add:

**Required:**
- `SUPABASE_URL` = Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
- `JWT_SECRET` = Generate a secure JWT secret
- `NODE_ENV` = `production`

**Optional:**
- `ALLOWED_ORIGINS` = `https://your-app-name.railway.app`

### 3. Database Setup
1. Create Supabase project: https://supabase.com
2. Run your schema.sql in Supabase SQL Editor
3. Get your Supabase URL and Service Role Key
4. Add them to Railway environment variables

### 4. Frontend Deployment
Option A: **Railway (Full-Stack)**
- Railway will automatically build and serve both frontend and backend

Option B: **Vercel (Frontend only)**
- Deploy frontend: https://vercel.com
- Update API URLs to point to Railway backend

## 🌐 Alternative Deployments

### Netlify + Railway
- Frontend: Netlify (static hosting)
- Backend: Railway (API + Socket.IO)

### DigitalOcean
- Frontend: DigitalOcean App Platform
- Backend: DigitalOcean Droplet

### AWS
- Frontend: S3 + CloudFront
- Backend: EC2 + RDS (or use Supabase)

## 🔧 Production Checklist

- [ ] Supabase project created
- [ ] Database schema migrated
- [ ] Environment variables set
- [ ] SSL certificate (automatic on Railway)
- [ ] Domain configured (optional)
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring

## 📱 Live Tracking Confirmation

Your live tracking will work perfectly in production:
- ✅ Socket.IO for real-time location updates
- ✅ Supabase for location history storage
- ✅ Geofencing for pickup/dropoff detection
- ✅ Driver state management

## 🚨 Important Notes

1. **Supabase Setup Required** - Create Supabase project first
2. **Environment Variables** - Must be set in Railway dashboard
3. **CORS Settings** - Update with your Railway URL
4. **Socket.IO** - Works automatically on Railway

Your app is production-ready with Supabase!
