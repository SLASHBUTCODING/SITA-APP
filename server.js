const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip compression
app.use(compression());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// For PWA: serve manifest.webmanifest with correct MIME type
app.get('/manifest.webmanifest', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'manifest.webmanifest'));
});

// For PWA: serve service worker with correct MIME type
app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'sw.js'));
});

// Handle all other routes - serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SITA PWA server running on port ${PORT}`);
});
