/**
 * Contract deployment is handled by Truffle migrations.
 *
 * 1. Start Ganache on port 7545 (or 8545 with --network ganache)
 * 2. npm run compile
 * 3. npm run migrate
 *
 * Deployment output is written to:
 *   - src/config/contract.deployment.json
 *   - src/config/CertificateRegistry.json
 */
console.log('Run: npm run compile && npm run migrate');
console.log('Ensure Ganache is running before migrating.');
