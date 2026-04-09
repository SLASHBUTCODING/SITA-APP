const CACHE_VERSION = "sita-v3";
const TILE_CACHE = "sita-tiles-v3";
const MAX_TILE_CACHE = 200; // max tiles to store (saves ~4MB cap)

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json"
];

// Map tile hostnames to cache
const TILE_HOSTS = [
  "basemaps.cartocdn.com",
  "tile.openstreetmap.org",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k !== TILE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Trim tile cache to MAX_TILE_CACHE entries
async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_TILE_CACHE) {
    const toDelete = keys.slice(0, keys.length - MAX_TILE_CACHE);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip Supabase, API calls — always go network
  if (
    url.hostname.includes("supabase") ||
    url.hostname.includes("127.0.0.1") ||
    url.pathname.includes("/api/") ||
    url.hostname.includes("nominatim")
  ) return;

  // Map tiles: cache-first, then network, store for next time
  if (TILE_HOSTS.some((h) => url.hostname.includes(h))) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          const response = await fetch(event.request);
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
            trimTileCache();
          }
          return response;
        } catch {
          return new Response("", { status: 503 });
        }
      })
    );
    return;
  }

  // App shell: network-first with cache fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match("/index.html"));
    })
  );
});
