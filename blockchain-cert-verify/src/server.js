const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { sequelize } = require('./models');

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));

const PORT = process.env.PORT || 3000;

sequelize.sync({ force: false }).then(async () => {
  console.log('Database connected');
  
  const blockchainService = require('./services/blockchainService');
  const contractArtifact = require('../artifacts/CertificateRegistry.json');
  
  if (process.env.CONTRACT_ADDRESS) {
    await blockchainService.initialize(process.env.CONTRACT_ADDRESS, contractArtifact.abi);
    console.log('Blockchain service initialized');
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection error:', err);
});