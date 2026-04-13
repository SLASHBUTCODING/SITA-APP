# SITA - Tricycle Ride-Hailing App

A ride-hailing platform connecting passengers with tricycle drivers in the Philippines. Built with React, TypeScript, Node.js, Express, and Supabase.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (for database and authentication)

## Quick Start (Clone & Run)

### 1. Clone the repository
```bash
git clone https://github.com/SLASHBUTCODING/SITA-APP.git
cd SITA APP
```

### 2. Setup Frontend

```bash
# Install dependencies
npm install

# Copy environment variables
cp frontend.env.example .env

# Edit .env with your Supabase credentials:
# VITE_SUPABASE_URL=https://your-project-ref.supabase.co
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
# VITE_API_URL=https://your-project-ref.supabase.co/functions/v1/sita-api

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration:
# SUPABASE_URL=your_supabase_project_url
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
# JWT_SECRET=your_super_secret_jwt_key
# PORT=3010
# SOCKET_PORT=3011

# Start development server
npm run dev
```

Backend runs on `http://localhost:3010`

### 4. Database Setup

The app uses Supabase as the database. You need to:

1. Create a Supabase project at https://supabase.com
2. Run the database schema from `backend/src/db/schema.sql` in the Supabase SQL Editor
3. Enable Realtime for `rides` and `drivers` tables in Supabase Dashboard
4. Get your Supabase URL and anon/service role keys from Supabase Dashboard

## Project Structure

```
SITA APP/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── customer/    # Customer portal pages
│   │   │   ├── driver/      # Driver portal pages
│   │   │   └── admin/       # Admin portal pages
│   │   ├── components/      # Shared components
│   │   ├── services/        # API and socket services
│   │   └── lib/             # Utilities (Supabase client)
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── db/              # Database schema
│   │   └── server.ts        # Express server
```

## Features

### Customer Portal
- Ride booking with fare calculation
- Real-time driver tracking
- Ride history and wallet management
- Profile and notifications

### Driver Portal
- Go online/offline toggle
- Accept/decline ride requests
- Earnings dashboard
- Location updates

### Admin Portal
- Driver verification
- User and ride management
- Dashboard analytics

## Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript
- Vite 6.3.5
- Tailwind CSS v4
- React Router 7.13.0
- Leaflet (maps)
- Supabase (backend/auth)
- Framer Motion (animations)

**Backend:**
- Node.js with Express
- PostgreSQL (via Supabase)
- Socket.IO (real-time)
- JWT authentication

## Default Admin Credentials

- Username: `superadmin`
- Password: `Admin@SITA2024`
- **Change this immediately after first login!**

## Development

### Frontend
```bash
npm run dev    # Start dev server
npm run build  # Build for production
```

### Backend
```bash
npm run dev    # Start dev server
npm run build  # Build for production
```

## Deployment

The app is designed to be deployed as:
- Frontend: Vercel, Netlify, or Render
- Backend: Render, Railway, or similar
- Database: Supabase (cloud-hosted)

## Original Design

The original project design is available at:
https://www.figma.com/design/8zE9q5quz41FEChEXdy3ie/Ride-hailing-app--Copy-

## License

This project is for educational and demonstration purposes.