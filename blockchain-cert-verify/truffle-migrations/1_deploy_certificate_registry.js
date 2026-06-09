const fs = require('fs');
const path = require('path');

const CertificateRegistry = artifacts.require('CertificateRegistry');

module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(CertificateRegistry);
  const instance = await CertificateRegistry.deployed();

  const deployment = {
    contractName: 'CertificateRegistry',
    address: instance.address,
    network,
    deployer: accounts[0],
    deployedAt: new Date().toISOString()
  };

  const configDir = path.join(__dirname, '../src/config');
  const deploymentPath = path.join(configDir, 'contract.deployment.json');
  const buildArtifactPath = path.join(__dirname, '../build/contracts/CertificateRegistry.json');

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  if (fs.existsSync(buildArtifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(buildArtifactPath, 'utf8'));
    const backendArtifactPath = path.join(configDir, 'CertificateRegistry.json');
    fs.writeFileSync(backendArtifactPath, JSON.stringify({
      contractName: artifact.contractName,
      abi: artifact.abi,
      address: instance.address,
      network,
      deployedAt: deployment.deployedAt
    }, null, 2));
  }

  console.log('CertificateRegistry deployed at:', instance.address);
  console.log('Saved deployment to src/config/contract.deployment.json');
  console.log('Saved backend artifact to src/config/CertificateRegistry.json');
};
