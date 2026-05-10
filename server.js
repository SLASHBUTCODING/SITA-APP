const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip compression
app.use(compression());

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// PWA / SPA entry points must always revalidate so installed PWAs pick up new
// deploys without a hard refresh. These handlers MUST run before
// `express.static` so the no-cache headers win.
app.get('/sw.js', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'dist', 'sw.js'));
});

app.get('/manifest.webmanifest', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'dist', 'manifest.webmanifest'));
});

app.get(['/', '/index.html'], (req, res) => {
  res.set(NO_CACHE_HEADERS);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Hashed bundles in dist/assets are content-addressed by Vite, so they're
// safe to cache forever.
app.use(
  express.static(path.join(__dirname, 'dist'), {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      const base = path.basename(filePath);
      if (base === 'sw.js' || base === 'manifest.webmanifest' || base === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

// SPA fallback: any unknown route serves index.html (no-cache).
app.get('*', (req, res) => {
  res.set(NO_CACHE_HEADERS);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SITA PWA server running on port ${PORT}`);
});
