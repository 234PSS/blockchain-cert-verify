const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { UPLOAD_ROOT } = require('./config/upload');
const { loadContractConfig } = require('./config/loadContract');

dotenv.config();

const requiredEnv = ['JWT_SECRET', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

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

const PORT = process.env.PORT || 3000;

sequelize.sync({ force: false }).then(async () => {
  console.log('Database connected');

  const blockchainService = require('./services/blockchainService');
  const { address, abi, deployment } = loadContractConfig();

  if (address && abi) {
    try {
      await blockchainService.initialize(address, abi);
      console.log('Blockchain service initialized at', address);
      if (deployment?.network) {
        console.log('Contract network:', deployment.network);
      }
    } catch (err) {
      console.warn('Blockchain unavailable:', err.message);
    }
  } else {
    blockchainService.markUnavailable(
      'Contract not deployed. Run: npm run compile && npm run migrate'
    );
    console.warn(blockchainService.getUnavailableReason());
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Database connection error:', err);
  process.exit(1);
});
