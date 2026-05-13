# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SITA** is a tricycle ride-hailing PWA for the Philippines with three portals (customer, driver, admin). The frontend is a Vite + React 18 + TypeScript SPA at the repo root; the backend is a separate Node/Express + Socket.IO package under `backend/`. Database and auth are provided by Supabase.

## Common Commands

Frontend (root):
- `npm run dev` — Vite dev server on **`http://127.0.0.1:5175`** (overridden in `vite.config.ts`; the README's `5173` is wrong).
- `npm run build` — outputs to `dist/`.
- `npm start` — runs `server.js`, a tiny Express static server that serves `dist/` and explicitly routes `/sw.js` and `/manifest.webmanifest` so PWA MIME types are correct in production.

Backend (`cd backend`):
- `npm run dev` — nodemon + ts-node on `src/server.ts`. Defaults to port `3010` (`SOCKET_PORT=3011`).
- `npm run build` / `npm start` — `tsc` to `dist/`, then `node dist/server.js`.

No test runner, lint script, or standalone typecheck script is configured in either package. `npm run build` is the only path that surfaces TS errors.

Default admin login for the `/admin` route (from README): `superadmin` / `Admin@SITA2024`.

## Architecture

### Two interchangeable backends
The frontend calls whatever `VITE_API_URL` points at. Two implementations are kept in sync:
- The Express server in [backend/src/server.ts](backend/src/server.ts), mounting `/api/auth`, `/api/users`, `/api/drivers`, `/api/rides`, `/api/admin`, plus Socket.IO via `initSocketServer` ([backend/src/socket/trackingServer.ts](backend/src/socket/trackingServer.ts)).
- The Supabase Edge Function in [supabase/functions/sita-api/index.ts](supabase/functions/sita-api/index.ts).

Pick the target per deployment; do not assume one is canonical.

### Realtime splits across two transports
The Express backend exposes Socket.IO, but the frontend's primary tracking path bypasses it and writes directly to Supabase. See [src/services/realtimeTracking.ts](src/services/realtimeTracking.ts) and [src/app/services/socket.ts](src/app/services/socket.ts) — they update the `drivers` and `rides` tables and subscribe via Supabase Realtime channels. Driver location writes are throttled to **1 per 10s**. The `rides` and `drivers` tables **must** have Realtime enabled in the Supabase dashboard or driver matching fails silently.

### Routing
[src/main.tsx](src/main.tsx) → [src/app/App.tsx](src/app/App.tsx) → [src/app/routes.ts](src/app/routes.ts) using `react-router` 7 `createBrowserRouter`. `/admin` is a top-level route (no shell); every other route nests inside [src/app/Root.tsx](src/app/Root.tsx), which is just a full-screen `<Outlet />`. Pages live in `src/app/pages/{customer,driver,admin}/`. `routes.ts` is the source of truth — don't enumerate routes elsewhere.

### Two Supabase clients — don't mix them
- Frontend: [src/lib/supabase.ts](src/lib/supabase.ts) uses the **anon key**. Auth state is mirrored to `localStorage` keys `sita_token`, `sita_user`, `sita_role` by [src/services/auth.ts](src/services/auth.ts).
- Backend: [backend/src/db/supabase.ts](backend/src/db/supabase.ts) uses the **service role key** with `persistSession: false` and issues its own JWTs.

### Driver document storage
Driver-uploaded docs live in the Supabase Storage bucket `driver-documents` (public read for prototype), keyed `{driverId}/{kind}.{ext}` where `kind ∈ license | nbi | barangay | medical`. URLs are written back to `drivers.{license_url, nbi_clearance_url, barangay_clearance_url, medical_certificate_url}`. Three of those columns are added via `ALTER TABLE … IF NOT EXISTS` in [schema.sql](backend/src/db/schema.sql) to match prod (the original `CREATE TABLE` only declares `license_url`). The actual upload goes through [src/services/driverDocs.ts](src/services/driverDocs.ts) — swap public URLs for signed URLs in there if you ever lock the bucket down.

### PWA
`vite-plugin-pwa` is configured in [vite.config.ts](vite.config.ts) with `registerType: 'autoUpdate'` and `devOptions.enabled: true` (service worker active in dev). Generated `dev-dist/sw.js` and `public/manifest.webmanifest` are committed. OpenStreetMap tiles (`[a-c].tile.openstreetmap.org`) are runtime-cached via Workbox `CacheFirst` (500 entries, 7 days) so maps survive offline.

### Path alias
`@` → `src/` (in `vite.config.ts`). Prefer it for cross-folder imports.

### Don't remove
The `react()` and `tailwindcss()` Vite plugins are required by Figma Make even when Tailwind isn't actively used — the comment in `vite.config.ts` says so explicitly.

## Environment Variables

Frontend (see `frontend.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.

Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `PORT`, `ALLOWED_ORIGINS` (CSV), `UPLOAD_DIR`.

## Database

Schema lives in [backend/src/db/schema.sql](backend/src/db/schema.sql). Apply it via the Supabase SQL editor. The `backend` package also has a `db:setup` script that targets a local Postgres, but the actual deployment path is Supabase-hosted.
