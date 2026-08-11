require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./events/socket');

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Initialize WebSockets
initSocket(server);

server.listen(PORT, () => {
  console.log(`[SERVER] Rubik's Lab API listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[SERVER] Closed remaining connections.');
    process.exit(0);
  });
});
