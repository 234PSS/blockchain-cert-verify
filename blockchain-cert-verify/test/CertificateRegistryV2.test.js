const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { sortBytes32, hashPair } = require('./merkleHelpers');

const CertificateRegistryV2 = artifacts.require('CertificateRegistryV2');

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const EMPTY_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

contract('CertificateRegistryV2', (accounts) => {
  const admin = accounts[0];
  const issuer1 = accounts[1];
  const issuer2 = accounts[2];
  const unauthorized = accounts[3];

  let registry;
  const ISSUER_ROLE = web3.utils.soliditySha3('ISSUER_ROLE');

  const makeCertId = (studentId, courseId, ts) =>
    web3.utils.soliditySha3(
      { t: 'string', v: studentId },
      { t: 'string', v: courseId },
      { t: 'uint256', v: ts }
    );

  before(async () => {
    // Manually deploy implementation + proxy
    const impl = await CertificateRegistryV2.new({ from: admin });
    const initData = impl.contract.methods.initialize(admin).encodeABI();
    const ERC1967ProxyArtifact = artifacts.require('ERC1967Proxy');
    const proxy = await ERC1967ProxyArtifact.new(impl.address, initData, { from: admin });
    registry = await CertificateRegistryV2.at(proxy.address);

    // Grant admin the ISSUER_ROLE so admin can also issue/revoke in tests
    const role = await registry.ISSUER_ROLE();
    await registry.grantRole(role, admin, { from: admin });
  });

  // ==================== INITIALIZATION ====================

  describe('initialization', () => {
    it('should grant DEFAULT_ADMIN_ROLE and ADMIN_ROLE to admin', async () => {
      const DEFAULT_ADMIN_ROLE = await registry.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await registry.ADMIN_ROLE();
      assert.isTrue(await registry.hasRole(DEFAULT_ADMIN_ROLE, admin));
      assert.isTrue(await registry.hasRole(ADMIN_ROLE, admin));
    });

    it('should not be paused initially', async () => {
      assert.isFalse(await registry.paused());
    });

    it('should have zero issuers', async () => {
      const count = await registry.getIssuerCount();
      assert.strictEqual(count.toNumber(), 0);
    });
  });

  // ==================== ROLE MANAGEMENT ====================

  describe('role management', () => {
    it('should allow admin to grant ISSUER_ROLE', async () => {
      const role = await registry.ISSUER_ROLE();
      await registry.grantRole(role, issuer1, { from: admin });
      await registry.grantRole(role, issuer2, { from: admin });
      assert.isTrue(await registry.hasRole(role, issuer1));
      assert.isTrue(await registry.hasRole(role, issuer2));
    });

    it('should reject non-admin from granting roles', async () => {
      const role = await registry.ISSUER_ROLE();
      try {
        await registry.grantRole(role, unauthorized, { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert');
      }
    });
  });

  // ==================== ISSUER REGISTRATION ====================

  describe('issuer registration (multi-tenant)', () => {
    it('should register an issuer', async () => {
      const tx = await registry.registerIssuer('University A', 'university-a.edu', { from: issuer1 });
      truffleAssert.eventEmitted(tx, 'IssuerRegistered', (ev) => {
        return ev.wallet === issuer1 && ev.name === 'University A' && ev.domain === 'university-a.edu';
      });
    });

    it('should reject duplicate issuer registration', async () => {
      try {
        await registry.registerIssuer('University A Again', 'again.edu', { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Already registered', 'Expected Already registered');
      }
    });

    it('should reject registration with empty name', async () => {
      try {
        await registry.registerIssuer('', 'foo.edu', { from: issuer2 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Name required', 'Expected Name required');
      }
    });

    it('should reject registration with empty domain', async () => {
      try {
        await registry.registerIssuer('Foo University', '', { from: issuer2 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Domain required', 'Expected Domain required');
      }
    });

    it('should return issuer count', async () => {
      await registry.registerIssuer('University B', 'university-b.edu', { from: issuer2 });
      const count = await registry.getIssuerCount();
      assert.strictEqual(count.toNumber(), 2);
    });

    it('should return issuer details', async () => {
      const issuer = await registry.getIssuer(issuer1);
      assert.strictEqual(issuer.name, 'University A');
      assert.strictEqual(issuer.domain, 'university-a.edu');
      assert.isTrue(issuer.active);
    });

    it('isIssuer returns true for registered issuers', async () => {
      assert.isTrue(await registry.isIssuer(issuer1));
    });

    it('isIssuer returns false for non-registered', async () => {
      assert.isFalse(await registry.isIssuer(unauthorized));
    });

    it('should update issuer status by admin', async () => {
      const tx = await registry.updateIssuerStatus(issuer1, false, { from: admin });
      truffleAssert.eventEmitted(tx, 'IssuerStatusUpdated', (ev) => {
        return ev.wallet === issuer1 && ev.active === false;
      });
      const issuer = await registry.getIssuer(issuer1);
      assert.isFalse(issuer.active);
      await registry.updateIssuerStatus(issuer1, true, { from: admin });
      const issuerAfter = await registry.getIssuer(issuer1);
      assert.isTrue(issuerAfter.active);
    });

    it('should reject issuer status update from non-admin', async () => {
      try {
        await registry.updateIssuerStatus(issuer1, false, { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert');
      }
    });

    it('should return all issuers', async () => {
      const result = await registry.getAllIssuers();
      const addresses = result[0];
      assert.isAtLeast(addresses.length, 2);
    });
  });

  // ==================== SINGLE CERTIFICATE OPERATIONS ====================

  describe('single certificate operations', () => {
    const certId = makeCertId('STU-001', 'CS-101', 1700000000);
    const certHash = web3.utils.soliditySha3('test-doc-hash-1');

    it('should issue a certificate', async () => {
      const tx = await registry.issueCertificate(certId, certHash, { from: issuer1 });
      truffleAssert.eventEmitted(tx, 'CertificateIssued', (ev) => {
        return ev.certificateId === certId && ev.certificateHash === certHash && ev.issuer === issuer1;
      });
    });

    it('should reject duplicate certificate issuance', async () => {
      try {
        await registry.issueCertificate(certId, certHash, { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Already exists', 'Expected Already exists');
      }
    });

    it('should reject issuance with zero certId', async () => {
      try {
        await registry.issueCertificate(EMPTY_HASH, certHash, { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Invalid certificate ID', 'Expected revert');
      }
    });

    it('should reject issuance with zero hash', async () => {
      const otherId = makeCertId('STU-002', 'CS-101', 1700000000);
      try {
        await registry.issueCertificate(otherId, EMPTY_HASH, { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Invalid hash', 'Expected revert');
      }
    });

    it('should reject issuance from non-issuer', async () => {
      try {
        await registry.issueCertificate(makeCertId('X', 'Y', 1), certHash, { from: unauthorized });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert');
      }
    });

    it('should verify an existing certificate', async () => {
      const result = await registry.verifyCertificate(certId);
      assert.isTrue(result.valid);
      assert.strictEqual(result.certificateHash, certHash);
      assert.strictEqual(result.issuer, issuer1);
      assert.isAbove(result.issuedAt.toNumber(), 0);
      assert.isFalse(result.revoked);
    });

    it('should return false for non-existent certificate', async () => {
      const fakeId = web3.utils.soliditySha3('fake');
      const result = await registry.verifyCertificate(fakeId);
      assert.isFalse(result.valid);
      assert.strictEqual(result.certificateHash, EMPTY_HASH);
      assert.strictEqual(result.issuer, ZERO_ADDR);
      assert.strictEqual(result.issuedAt.toNumber(), 0);
      assert.isFalse(result.revoked);
    });

    it('should revoke a certificate', async () => {
      const tx = await registry.revokeCertificate(certId, { from: issuer1 });
      truffleAssert.eventEmitted(tx, 'CertificateRevoked', (ev) => {
        return ev.certificateId === certId;
      });
      const result = await registry.verifyCertificate(certId);
      assert.isTrue(result.revoked);
    });

    it('should reject double revocation', async () => {
      try {
        await registry.revokeCertificate(certId, { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Already revoked', 'Expected Already revoked');
      }
    });

    it('should reject revoking non-existent certificate', async () => {
      try {
        await registry.revokeCertificate(EMPTY_HASH, { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Does not exist', 'Expected Does not exist');
      }
    });

    it('should allow admin to revoke any certificate', async () => {
      const id = makeCertId('STU-ADMIN', 'CS-101', 1700000001);
      await registry.issueCertificate(id, certHash, { from: issuer1 });
      // Admin has ISSUER_ROLE, can revoke
      await registry.revokeCertificate(id, { from: admin });
      const result = await registry.verifyCertificate(id);
      assert.isTrue(result.revoked);
    });

    it('should reject revocation from non-issuer', async () => {
      const id = makeCertId('STU-NONISS', 'CS-101', 1700000002);
      await registry.issueCertificate(id, web3.utils.soliditySha3('h'), { from: issuer1 });
      try {
        await registry.revokeCertificate(id, { from: unauthorized });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert');
      }
    });

    it('getCertificate returns full details', async () => {
      const id = makeCertId('STU-GET', 'CS-101', 1700000003);
      await registry.issueCertificate(id, certHash, { from: issuer1 });
      const cert = await registry.getCertificate(id);
      assert.strictEqual(cert.certificateHash, certHash);
      assert.strictEqual(cert.issuer, issuer1);
    });
  });

  // ==================== BATCH OPERATIONS ====================

  describe('batch operations', () => {
    const batchSize = 10;
    const certIds = [];
    const certHashes = [];

    before(() => {
      for (let i = 0; i < batchSize; i++) {
        certIds.push(makeCertId(`BATCH-${i}`, 'CS-200', 1700000100 + i));
        certHashes.push(web3.utils.soliditySha3(`batch-doc-${i}`));
      }
    });

    it('should issue certificates in batch', async () => {
      const tx = await registry.issueCertificatesBatch(
        certIds.slice(0, 5), certHashes.slice(0, 5), { from: issuer1 }
      );
      truffleAssert.eventEmitted(tx, 'CertificatesBatchIssued', (ev) => {
        return ev.count.toNumber() === 5;
      });
      for (let i = 0; i < 5; i++) {
        const result = await registry.verifyCertificate(certIds[i]);
        assert.isTrue(result.valid, `Certificate ${i} should be valid`);
      }
    });

    it('should reject batch with mismatched lengths', async () => {
      try {
        await registry.issueCertificatesBatch(certIds, certHashes.slice(0, 3), { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Length mismatch', 'Expected Length mismatch');
      }
    });

    it('should reject empty batch', async () => {
      try {
        await registry.issueCertificatesBatch([], [], { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Empty batch', 'Expected Empty batch');
      }
    });

    it('should revoke certificates in batch', async () => {
      const idsToRevoke = certIds.slice(0, 3);
      const tx = await registry.revokeCertificatesBatch(idsToRevoke, { from: issuer1 });
      truffleAssert.eventEmitted(tx, 'CertificatesBatchRevoked', (ev) => {
        return ev.count.toNumber() === 3;
      });
      for (const id of idsToRevoke) {
        const result = await registry.verifyCertificate(id);
        assert.isTrue(result.revoked, 'Certificate should be revoked');
      }
    });

    it('should reject batch revoke for non-existent certs', async () => {
      const fakeId = web3.utils.soliditySha3('nope');
      try {
        await registry.revokeCertificatesBatch([fakeId], { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'Cert not found', 'Expected Cert not found');
      }
    });
  });

  // ==================== MERKLE TREE ====================

  describe('Merkle tree operations', () => {
    it('should update merkle root', async () => {
      const root = web3.utils.soliditySha3('merkle-root-1');
      const tx = await registry.updateMerkleRoot(root, { from: issuer1 });
      truffleAssert.eventEmitted(tx, 'MerkleRootUpdated', (ev) => {
        return ev.merkleRoot === root && ev.issuer === issuer1;
      });
    });

    it('should return stored merkle root', async () => {
      const root = web3.utils.soliditySha3('merkle-root-1');
      const result = await registry.getIssuerMerkleRoot(issuer1);
      assert.strictEqual(result[0], root);
      assert.isAbove(result[1].toNumber(), 0);
    });

    it('should verify a valid merkle proof', async () => {
      const leaf = web3.utils.soliditySha3('leaf-1');
      const leaf2 = web3.utils.soliditySha3('leaf-2');
      const root = hashPair(leaf, leaf2);
      await registry.updateMerkleRoot(root, { from: issuer2 });

      const proof = [leaf2];
      const valid = await registry.verifyByMerkleProof(leaf, proof, issuer2);
      assert.isTrue(valid);
    });

    it('should reject an invalid merkle proof', async () => {
      const leaf = web3.utils.soliditySha3('real-leaf');
      const otherLeaf = web3.utils.soliditySha3('other-leaf');
      const wrongSibling = web3.utils.soliditySha3('wrong-sibling');
      const root = hashPair(leaf, otherLeaf);
      await registry.updateMerkleRoot(root, { from: issuer1 });

      // wrongSibling is not the actual sibling, so verification fails
      const [expectedSibling] = sortBytes32(leaf, wrongSibling);
      const valid = await registry.verifyByMerkleProof(leaf, [expectedSibling], issuer1);
      assert.isFalse(valid);
    });

    it('should return false for issuer with no merkle root', async () => {
      const valid = await registry.verifyByMerkleProof(EMPTY_HASH, [], unauthorized);
      assert.isFalse(valid);
    });
  });

  // ==================== PAUSE / CIRCUIT BREAKER ====================

  describe('circuit breaker (pause/unpause)', () => {
    it('should pause the contract', async () => {
      const tx = await registry.pause({ from: admin });
      truffleAssert.eventEmitted(tx, 'ContractPaused', (ev) => {
        return ev.pauser === admin;
      });
      assert.isTrue(await registry.paused());
    });

    it('should reject certificate issuance when paused', async () => {
      const id = web3.utils.soliditySha3('paused-cert');
      try {
        await registry.issueCertificate(id, web3.utils.soliditySha3('h'), { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert when paused');
      }
    });

    it('should reject batch issuance when paused', async () => {
      try {
        await registry.issueCertificatesBatch(
          [web3.utils.soliditySha3('p1')],
          [web3.utils.soliditySha3('h1')],
          { from: issuer1 }
        );
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert when paused');
      }
    });

    it('should reject revocation when paused', async () => {
      try {
        await registry.revokeCertificate(EMPTY_HASH, { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert when paused');
      }
    });

    it('should reject merkle root update when paused', async () => {
      try {
        await registry.updateMerkleRoot(EMPTY_HASH, { from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert when paused');
      }
    });

    it('should reject pause from non-admin', async () => {
      try {
        await registry.pause({ from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert');
      }
    });

    it('should unpause the contract', async () => {
      const tx = await registry.unpause({ from: admin });
      truffleAssert.eventEmitted(tx, 'ContractUnpaused', (ev) => {
        return ev.unpauser === admin;
      });
      assert.isFalse(await registry.paused());
    });

    it('should resume operations after unpause', async () => {
      const id = web3.utils.soliditySha3('resumed-cert');
      const hash = web3.utils.soliditySha3('resumed-doc');
      await registry.issueCertificate(id, hash, { from: issuer1 });
      const result = await registry.verifyCertificate(id);
      assert.isTrue(result.valid);
    });

    it('should reject unpause from non-admin', async () => {
      try {
        await registry.unpause({ from: issuer1 });
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert');
      }
    });
  });

  // ==================== ENUMERATION ====================

  describe('enumeration helpers', () => {
    it('should count certificates', async () => {
      const count = await registry.getCertificateCount();
      assert.isAbove(count.toNumber(), 0);
    });

    it('should retrieve certificate ID by index', async () => {
      const id = await registry.getCertificateAt(0);
      assert.isTrue(id !== EMPTY_HASH);
    });

    it('should get certificates by issuer', async () => {
      const ids = await registry.getCertificatesByIssuer(issuer1);
      assert.isAbove(ids.length, 0);
      for (const id of ids) {
        const result = await registry.verifyCertificate(id);
        assert.strictEqual(result.issuer, issuer1);
      }
    });
  });

  // ==================== BACKWARD-COMPATIBLE HELPERS ====================

  describe('backward-compatible helpers', () => {
    it('computeCertificateId produces deterministic output', async () => {
      const onChain = await registry.computeCertificateId('STU-001', 'CS-101', 1700000000);
      const offChain = web3.utils.soliditySha3(
        { t: 'string', v: 'STU-001' },
        { t: 'string', v: 'CS-101' },
        { t: 'uint256', v: '1700000000' }
      );
      assert.strictEqual(onChain, offChain);
    });

    it('hashCertificateData produces deterministic output', async () => {
      const { ethers } = require('ethers');
      const onChain = await registry.hashCertificateData(
        'Alice', 'STU-001', 'CS-101', 'C-101', 'University A', 1700000000, 'doc-hash'
      );
      const offChain = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['string', 'string', 'string', 'string', 'string', 'uint256', 'string'],
          ['Alice', 'STU-001', 'CS-101', 'C-101', 'University A', 1700000000, 'doc-hash']
        )
      );
      assert.strictEqual(onChain, offChain);
    });
  });

  // ==================== MERKLE ROOT HISTORY ====================

  describe('merkle root history', () => {
    it('should append each merkle root update to history', async () => {
      const root1 = web3.utils.soliditySha3('history-root-1');
      const root2 = web3.utils.soliditySha3('history-root-2');
      const before = (await registry.getIssuerMerkleRootHistoryLength(issuer1)).toNumber();

      await registry.updateMerkleRoot(root1, { from: issuer1 });
      await registry.updateMerkleRoot(root2, { from: issuer1 });

      const after = (await registry.getIssuerMerkleRootHistoryLength(issuer1)).toNumber();
      assert.strictEqual(after, before + 2);
      assert.strictEqual(await registry.getIssuerMerkleRootHistoryAt(issuer1, after - 2), root1);
      assert.strictEqual(await registry.getIssuerMerkleRootHistoryAt(issuer1, after - 1), root2);
    });
  });

  // ==================== NULLIFIER VERIFICATION ====================

  describe('nullifier verification', () => {
    it('should reject verifyWithNullifier when paused', async () => {
      const leaf = web3.utils.soliditySha3('paused-nullifier-leaf');
      const sibling = web3.utils.soliditySha3('paused-nullifier-sibling');
      const root = hashPair(leaf, sibling);
      await registry.updateMerkleRoot(root, { from: issuer1 });

      await registry.pause({ from: admin });
      try {
        await registry.verifyWithNullifier(
          leaf, [sibling], issuer1, web3.utils.soliditySha3('paused-nullifier'), { from: issuer1 }
        );
        assert.fail('Should have reverted');
      } catch (err) {
        assert.include(err.message, 'revert', 'Expected revert when paused');
      }
      await registry.unpause({ from: admin });
    });
  });
});
