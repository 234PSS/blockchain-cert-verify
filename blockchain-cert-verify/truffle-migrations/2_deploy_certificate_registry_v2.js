const fs = require('fs');
const path = require('path');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const CertificateRegistryV2 = artifacts.require('CertificateRegistryV2');

module.exports = async (deployer, network, accounts) => {
  const adminAddress = accounts[0];

  const instance = await deployProxy(CertificateRegistryV2, [adminAddress], {
    deployer,
    initializer: 'initialize'
  });

  const issuerRole = await instance.ISSUER_ROLE();
  await instance.grantRole(issuerRole, adminAddress, { from: adminAddress });

  const deployment = {
    contractName: 'CertificateRegistryV2',
    address: instance.address,
    implementation: await instance._getImplementationAddress
      ? await instance._getImplementationAddress()
      : undefined,
    network,
    admin: adminAddress,
    deployer: accounts[0],
    deployedAt: new Date().toISOString()
  };

  const configDir = path.join(__dirname, '../src/config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const deploymentPath = path.join(configDir, 'contract.deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  const buildArtifactPath = path.join(__dirname, '../build/contracts/CertificateRegistryV2.json');
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

  console.log('CertificateRegistryV2 (upgradeable) deployed at:', instance.address);
  console.log('Admin address:', adminAddress);
  console.log('Saved deployment to src/config/contract.deployment.json');
  console.log('Saved ABI to src/config/CertificateRegistry.json');
};
