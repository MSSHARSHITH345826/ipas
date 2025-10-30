const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;

// Check if HTTPS is enabled and certificates are provided
if (process.env.HTTPS === 'true' && process.env.SSL_CRT_FILE && process.env.SSL_KEY_FILE) {
  try {
    const httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_FILE),
      cert: fs.readFileSync(process.env.SSL_CRT_FILE)
    };

    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log(`✅ HTTPS Server running securely on https://localhost:${PORT}`);
      console.log(`📜 Using certificate: ${process.env.SSL_CRT_FILE}`);
    });
  } catch (error) {
    console.error('❌ Error starting HTTPS server:', error.message);
    console.log('💡 Falling back to HTTP server...');
    startHttpServer();
  }
} else {
  console.log('ℹ️  HTTPS not configured, starting HTTP server...');
  startHttpServer();
}

function startHttpServer() {
  http.createServer(app).listen(PORT, () => {
    console.log(`🌐 HTTP Server running on http://localhost:${PORT}`);
    console.log('⚠️  Warning: Running without HTTPS. Configure SSL certificates for production.');
  });
}

