# 🚀 Supabase Deployment Guide

## Option 1: Supabase Edge Functions (Backend)

### 1. Install Supabase CLI
```bash
npm install -g supabase
supabase login
```

### 2. Initialize Supabase Project
```bash
supabase init
supabase link --project-ref your-project-ref
```

### 3. Create Edge Function
```bash
supabase functions new sita-api
```

### 4. Deploy Backend
```bash
supabase functions deploy sita-api
```

## Option 2: Vercel + Supabase (Recommended)

### Frontend: Vercel
```bash
# Install Vercel CLI
npm install -g vercel
vercel login

# Deploy frontend
cd frontend
vercel --prod
```

### Backend: Supabase Edge Functions
```bash
# Deploy API to Supabase
supabase functions deploy sita-api
```

## Option 3: Netlify + Supabase

### Frontend: Netlify
- Connect GitHub repo to Netlify
- Auto-deploy on push
- Custom domain support

### Backend: Supabase Edge Functions
- Real-time API with Supabase
- Built-in authentication
- Database included

## 🔧 Configuration Files

### supabase/config.toml
```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public"]

[functions]
enabled = true
verify_jwt = false

[storage]
enabled = true
file_size_limit = "5MiB"

[auth]
enabled = true
site_url = "https://your-app.vercel.app"
additional_redirect_urls = ["https://your-app.vercel.app/**"]

[realtime]
enabled = true
```

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

## 🌐 Deployment Steps

### Step 1: Setup Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Run database schema
4. Get project URL and keys

### Step 2: Deploy Frontend (Vercel)
```bash
vercel --prod
```

### Step 3: Deploy Backend (Supabase)
```bash
supabase functions deploy sita-api
```

### Step 4: Update Environment Variables
- Frontend: Supabase URL and anon key
- Backend: Supabase service role key

## 📱 Live Tracking with Supabase

Your live tracking will work perfectly:
- ✅ Supabase Realtime for location updates
- ✅ Edge Functions for API
- ✅ Built-in WebSocket support
- ✅ No external server needed

## 💰 Cost Comparison

- **Railway**: $5-20/month (after trial)
- **Supabase**: Free tier + $20/month (Edge Functions)
- **Vercel**: Free tier + Pro plan ($20/month)
- **Total**: ~$40/month vs $20/month (Railway)

## 🚀 Next Steps

1. Choose deployment option
2. Create Supabase project
3. Deploy frontend to Vercel/Netlify
4. Deploy backend to Supabase Edge Functions
5. Update environment variables
6. Test live tracking

Supabase hosting will be more cost-effective and integrated!
