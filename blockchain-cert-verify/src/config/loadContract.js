const fs = require('fs');
const path = require('path');

const CONFIG_DIR = __dirname;

const ARTIFACT_PATHS = [
  path.join(CONFIG_DIR, 'CertificateRegistry.json'),
  path.join(CONFIG_DIR, '../../build/contracts/CertificateRegistry.json'),
  path.join(CONFIG_DIR, '../../artifacts/CertificateRegistry.json')
];

const loadContractConfig = () => {
  const deploymentPath = path.join(CONFIG_DIR, 'contract.deployment.json');
  let address = process.env.CONTRACT_ADDRESS || null;
  let deployment = null;

  if (fs.existsSync(deploymentPath)) {
    deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    address = address || deployment.address;
  }

  let artifact = null;
  for (const artifactPath of ARTIFACT_PATHS) {
    if (fs.existsSync(artifactPath)) {
      artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      address = address || artifact.address;
      break;
    }
  }

  return {
    address,
    abi: artifact?.abi || null,
    deployment,
    artifactPath: artifact ? ARTIFACT_PATHS.find((p) => fs.existsSync(p)) : null
  };
};

module.exports = { loadContractConfig };
