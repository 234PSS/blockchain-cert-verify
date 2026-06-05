const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { UPLOAD_ROOT } = require('./config/upload');

const app = express();

app.use(cors());
app.use(helmet());
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

app.use('/uploads', express.static(UPLOAD_ROOT));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
