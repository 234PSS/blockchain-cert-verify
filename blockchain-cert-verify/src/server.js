const dotenv = require('dotenv');
const { sequelize } = require('./models');
const { loadContractConfig } = require('./config/loadContract');
const app = require('./app');

dotenv.config();

const requiredEnv = ['JWT_SECRET', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

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
