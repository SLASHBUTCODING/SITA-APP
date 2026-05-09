// Avatar helpers — replaces the inlined SVG placeholders that used to live
// in five different page files (DRIVER_IMAGE / CUSTOMER_IMAGE / USER_IMAGE).

const PALETTE = [
  "#F47920", "#1a1a2e", "#22c55e", "#3b82f6",
  "#a855f7", "#ec4899", "#0ea5e9", "#f59e0b",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Inline SVG data-URL with the user's initials over a stable per-name colour.
// Matches the previous inlined-SVG style so we can drop it into <img src=...>.
export function initialsAvatarDataUrl(name: string): string {
  const bg = PALETTE[hashString(name || "?") % PALETTE.length];
  const text = initials(name);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='${bg}'/><text x='50' y='58' font-family='system-ui,Segoe UI,Roboto,sans-serif' font-size='40' font-weight='700' fill='white' text-anchor='middle'>${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Returns the user's avatar URL if set, otherwise an initials-based SVG.
export function avatarUrl(
  name: string,
  url?: string | null,
): string {
  if (url && url.trim().length > 0 && !url.includes("placeholder")) return url;
  return initialsAvatarDataUrl(name);
}
