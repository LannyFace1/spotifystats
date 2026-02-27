// MySpotify Server - Main entry point
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');
const userRoutes = require('./routes/user');
const historyRoutes = require('./routes/history');
const logger = require('./services/logger');
const { startPolling } = require('./services/poller');

const app = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Trust proxy (for Nginx)
app.set('trust proxy', 1);

// CORS
const allowedOrigins = (process.env.CORS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsing & cookies
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// HTTP logging
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Global error handler - never leak stack traces
app.use((err, req, res, _next) => {
  logger.error(`${err.message} - ${req.method} ${req.url}`);
  res.status(err.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 8080;
mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/myspotify')
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
    // Start background Spotify polling
    startPolling();
  })
  .catch(err => {
    logger.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
