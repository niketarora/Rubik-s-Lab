const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${elapsed}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount Routes
const solveRoutes = require('./routes/solveRoutes');
const benchmarkRoutes = require('./routes/benchmarkRoutes');
const historyRoutes = require('./routes/historyRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/v1/cube', solveRoutes);
app.use('/api/v1/jobs', solveRoutes); // Map both endpoints for flexibility
app.use('/api/v1/benchmarks', benchmarkRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
