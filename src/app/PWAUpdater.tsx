import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

// Routes where a silent reload would interrupt GPS / Realtime mid-trip.
const ACTIVE_RIDE_PATHS = ['/customer/ride', '/driver/active'];

let pendingUpdate = false;
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;

function isOnRide(): boolean {
  const p = window.location.pathname;
  return ACTIVE_RIDE_PATHS.some((r) => p.startsWith(r));
}

function tryApply() {
  if (!pendingUpdate || !updateSW) return;
  if (isOnRide()) return; // defer; we'll retry on next route change
  pendingUpdate = false;
  updateSW(true);
}

// Register the service worker once at module load. Polls for a new SW every
// 60s so an installed PWA picks up new deploys without a hard refresh.
if (typeof window !== 'undefined' && !updateSW) {
  updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60_000);
    },
    onNeedRefresh() {
      pendingUpdate = true;
      tryApply();
    },
  });

  // Patch history methods so we can detect SPA navigations and retry the
  // deferred reload when the user leaves an active-ride route.
  const fire = () => window.dispatchEvent(new Event('sita:locationchange'));
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    const r = origPush.apply(this, args as any);
    fire();
    return r;
  };
  history.replaceState = function (...args) {
    const r = origReplace.apply(this, args as any);
    fire();
    return r;
  };
  window.addEventListener('popstate', fire);
  window.addEventListener('sita:locationchange', tryApply);
}

export function PWAUpdater() {
  useEffect(() => {
    // Re-check on tab visibility regain — the user coming back to the PWA is
    // a great moment to apply a queued update.
    const onVisible = () => {
      if (document.visibilityState === 'visible') tryApply();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
  return null;
}
