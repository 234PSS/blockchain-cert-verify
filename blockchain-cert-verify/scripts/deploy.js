const hre = require("hardhat");

async function main() {
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const certificateRegistry = await CertificateRegistry.deploy();

  await certificateRegistry.waitForDeployment();

  console.log("CertificateRegistry deployed to:", certificateRegistry.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});