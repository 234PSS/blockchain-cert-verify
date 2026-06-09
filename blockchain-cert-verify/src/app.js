const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { globalLimiter, authLimiter, certificateVerifyLimiter } = require('./middleware/rateLimiter');
const { UPLOAD_ROOT } = require('./config/upload');

const app = express();

const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.get('/health', (_req, res) => {
  const blockchainService = require('./services/blockchainService');
  res.json({
    success: true,
    status: 'ok',
    blockchain: blockchainService.getStatus()
  });
});

app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '1d' }));

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/certificates', certificateVerifyLimiter, require('./routes/certificateRoutes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
