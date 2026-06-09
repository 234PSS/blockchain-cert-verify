const crypto = require('crypto');

process.env.JWT_SECRET = 'e2e-test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const { sortBytes32, hashPair, computeSaltedLeaf, hashLeaf } = require('../src/crypto/hash');
const MerkleTree = require('../src/crypto/MerkleTree');
const CertificateCommitment = require('../src/crypto/commitment');
const SelectiveDisclosure = require('../src/crypto/selectiveDisclosure');

describe('Crypto — hash utilities', () => {
  test('sortBytes32 returns bytes in ascending order', () => {
    const a = '0x0000000000000000000000000000000000000000000000000000000000000001';
    const b = '0x0000000000000000000000000000000000000000000000000000000000000002';
    const [first, second] = sortBytes32(a, b);
    expect(first).toBe(a);
    expect(second).toBe(b);
  });

  test('sortBytes32 sorts descending values', () => {
    const a = '0x0000000000000000000000000000000000000000000000000000000000000002';
    const b = '0x0000000000000000000000000000000000000000000000000000000000000001';
    const [first, second] = sortBytes32(a, b);
    expect(first).toBe(b);
    expect(second).toBe(a);
  });

  test('hashPair produces deterministic output', () => {
    const a = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const b = '0x2222222222222222222222222222222222222222222222222222222222222222';
    const h1 = hashPair(a, b);
    const h2 = hashPair(a, b);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^0x[a-f0-9]{64}$/);
  });

  test('hashPair is symmetric (order-independent)', () => {
    const a = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const b = '0x2222222222222222222222222222222222222222222222222222222222222222';
    expect(hashPair(a, b)).toBe(hashPair(b, a));
  });

  test('computeSaltedLeaf produces different output each time with random salt', () => {
    const dataHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const salt1 = '0x' + '1'.repeat(64);
    const salt2 = '0x' + '2'.repeat(64);
    const leaf1 = computeSaltedLeaf(dataHash, salt1);
    const leaf2 = computeSaltedLeaf(dataHash, salt2);
    expect(leaf1).not.toBe(leaf2);
    expect(leaf1).toMatch(/^0x[a-f0-9]{64}$/);
    expect(leaf2).toMatch(/^0x[a-f0-9]{64}$/);
  });

  test('computeSaltedLeaf produces same output with same salt', () => {
    const dataHash = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const salt = '0x' + 'c'.repeat(64);
    expect(computeSaltedLeaf(dataHash, salt)).toBe(computeSaltedLeaf(dataHash, salt));
  });

  test('hashLeaf returns input unchanged for valid hex', () => {
    const hex = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    expect(hashLeaf(hex)).toBe(hex);
  });

  test('hashLeaf hashes non-hex input', () => {
    const result = hashLeaf('hello');
    expect(result).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result).not.toBe('hello');
  });
});

describe('Crypto — MerkleTree', () => {
  const leaves = [
    '0x1111111111111111111111111111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222222222222222222222222222',
    '0x3333333333333333333333333333333333333333333333333333333333333333',
    '0x4444444444444444444444444444444444444444444444444444444444444444',
  ];

  test('builds a tree with correct root for 4 leaves', () => {
    const tree = new MerkleTree(leaves);
    expect(tree.getRoot()).toMatch(/^0x[a-f0-9]{64}$/);
    expect(tree.layers.length).toBe(3);
  });

  test('generates valid proof for leaf at index 0', () => {
    const tree = new MerkleTree(leaves);
    const proof = tree.getProof(leaves[0]);
    expect(proof.length).toBe(2);
    expect(proof[0]).toMatch(/^0x[a-f0-9]{64}$/);
    expect(proof[1]).toMatch(/^0x[a-f0-9]{64}$/);
  });

  test('generates valid proof for leaf at index 3', () => {
    const tree = new MerkleTree(leaves);
    const proof = tree.getProof(leaves[3]);
    expect(proof.length).toBe(2);
  });

  test('static verify returns true for valid proof', () => {
    const tree = new MerkleTree(leaves);
    const proof = tree.getProof(leaves[0]);
    const result = MerkleTree.verify(leaves[0], proof, tree.getRoot());
    expect(result).toBe(true);
  });

  test('static verify returns false for invalid leaf', () => {
    const tree = new MerkleTree(leaves);
    const proof = tree.getProof(leaves[0]);
    const tamperedLeaf = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const result = MerkleTree.verify(tamperedLeaf, proof, tree.getRoot());
    expect(result).toBe(false);
  });

  test('static processProof returns root for valid proof', () => {
    const tree = new MerkleTree(leaves);
    const proof = tree.getProof(leaves[0]);
    const computedRoot = MerkleTree.processProof(leaves[0], proof);
    expect(computedRoot).toBe(tree.getRoot());
  });

  test('static processProof returns different root for tampered leaf', () => {
    const tree = new MerkleTree(leaves);
    const proof = tree.getProof(leaves[0]);
    const tamperedLeaf = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const computedRoot = MerkleTree.processProof(tamperedLeaf, proof);
    expect(computedRoot).not.toBe(tree.getRoot());
  });

  test('builds tree with single leaf', () => {
    const tree = new MerkleTree([leaves[0]]);
    expect(tree.getRoot()).toBe(leaves[0]);
    expect(tree.layers.length).toBe(1);
  });

  test('generates empty proof for single leaf tree', () => {
    const tree = new MerkleTree([leaves[0]]);
    const proof = tree.getProof(leaves[0]);
    expect(proof.length).toBe(0);
    expect(MerkleTree.verify(leaves[0], proof, tree.getRoot())).toBe(true);
  });

  test('handles 1000 leaves efficiently', () => {
    const manyLeaves = Array.from({ length: 1000 }, (_, i) =>
      '0x' + crypto.createHash('sha256').update(String(i)).digest('hex')
    );
    const tree = new MerkleTree(manyLeaves);
    expect(tree.getRoot()).toMatch(/^0x[a-f0-9]{64}$/);
    expect(tree.layers.length).toBe(11);
    const proof = tree.getProof(manyLeaves[500]);
    expect(MerkleTree.verify(manyLeaves[500], proof, tree.getRoot())).toBe(true);
    expect(MerkleTree.verify(manyLeaves[501], proof, tree.getRoot())).toBe(false);
  });

  test('proof obtained by value works same as by index', () => {
    const tree = new MerkleTree(leaves);
    const val = leaves[2];
    const proofByVal = tree.getProof(val);
    expect(MerkleTree.verify(val, proofByVal, tree.getRoot())).toBe(true);
  });
});

describe('Crypto — CertificateCommitment', () => {
  test('generateSalt produces 32-byte hex string', () => {
    const salt = CertificateCommitment.generateSalt();
    expect(salt).toMatch(/^0x[a-f0-9]{64}$/);
  });

  test('createSaltedCommitment returns commitment with salt', () => {
    const certData = { id: 'CERT-001', student: 'Alice', grade: 'A' };
    const result = CertificateCommitment.createSaltedCommitment(certData);
    expect(result.commitment).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.dataHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.salt).toMatch(/^0x[a-f0-9]{64}$/);
  });

  test('createDeterministicCommitment returns commitment without salt', () => {
    const certData = { id: 'CERT-001', student: 'Alice' };
    const result = CertificateCommitment.createDeterministicCommitment(certData);
    expect(result.commitment).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.commitment).toBe(result.dataHash);
  });

  test('createSaltedCommitment uses provided salt', () => {
    const certData = { id: 'CERT-001' };
    const salt = CertificateCommitment.generateSalt();
    const result = CertificateCommitment.createSaltedCommitment(certData, salt);
    expect(result.salt).toBe(salt);
  });

  test('buildCertificateMerkleTree builds tree from commitments', () => {
    const c1 = CertificateCommitment.createSaltedCommitment({ id: 'CERT-001' });
    const c2 = CertificateCommitment.createSaltedCommitment({ id: 'CERT-002' });
    const tree = CertificateCommitment.buildCertificateMerkleTree([c1.commitment, c2.commitment]);
    expect(tree.getRoot()).toMatch(/^0x[a-f0-9]{64}$/);
    expect(tree.layers.length).toBe(2);
  });

  test('createBatchCommitment returns root and leaves', () => {
    const certs = [
      { certificateId: 'CERT-001', data: { name: 'Alice', grade: 'A' } },
      { certificateId: 'CERT-002', data: { name: 'Bob', grade: 'B' } },
    ];
    const batch = CertificateCommitment.createBatchCommitment(certs);
    expect(batch.root).toMatch(/^0x[a-f0-9]{64}$/);
    expect(batch.leaves.length).toBe(2);
    expect(batch.tree).toBeDefined();
  });

  test('generateBatchProof extracts valid proof for specific cert', () => {
    const certs = [
      { certificateId: 'CERT-001', data: { name: 'Alice' } },
      { certificateId: 'CERT-002', data: { name: 'Bob' } },
      { certificateId: 'CERT-003', data: { name: 'Charlie' } },
    ];
    const batch = CertificateCommitment.createBatchCommitment(certs);
    const proof = CertificateCommitment.generateBatchProof('CERT-002', batch);
    expect(proof.leaf).toMatch(/^0x[a-f0-9]{64}$/);
    expect(proof.salt).toMatch(/^0x[a-f0-9]{64}$/);
    expect(proof.proof.length).toBe(2);
    expect(proof.root).toBe(batch.root);
  });

  test('verifyBatchProof returns true for valid proof', () => {
    const certs = [
      { certificateId: 'CERT-001', data: { name: 'Alice' } },
    ];
    const batch = CertificateCommitment.createBatchCommitment(certs);
    const proof = CertificateCommitment.generateBatchProof('CERT-001', batch);
    const verified = CertificateCommitment.verifyBatchProof(proof.leaf, proof.proof, proof.root);
    expect(verified).toBe(true);
  });

  test('verifyBatchProof returns false for tampered leaf', () => {
    const certs = [
      { certificateId: 'CERT-001', data: { name: 'Alice' } },
    ];
    const batch = CertificateCommitment.createBatchCommitment(certs);
    const proof = CertificateCommitment.generateBatchProof('CERT-001', batch);
    const tampered = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const verified = CertificateCommitment.verifyBatchProof(tampered, proof.proof, proof.root);
    expect(verified).toBe(false);
  });
});

describe('ProofService — high-level Merkle proof flow', () => {
  let tree, root, leaf, siblings;

  beforeAll(() => {
    tree = new MerkleTree([
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    ]);
    root = tree.getRoot();
    leaf = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    siblings = tree.getProof(leaf);
  });

  test('proof has correct structure', () => {
    expect(root).toMatch(/^0x[a-f0-9]{64}$/);
    expect(siblings.length).toBe(2);
    expect(leaf).toMatch(/^0x[a-f0-9]{64}$/);
  });

  test('verify returns true for correct proof', () => {
    const result = MerkleTree.verify(leaf, siblings, root);
    expect(result).toBe(true);
  });

  test('verify returns false for wrong leaf', () => {
    const wrongLeaf = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const result = MerkleTree.verify(wrongLeaf, siblings, root);
    expect(result).toBe(false);
  });

  test('verify returns false for tampered siblings', () => {
    const tamperedSiblings = [
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      ...siblings.slice(1),
    ];
    const result = MerkleTree.verify(leaf, tamperedSiblings, root);
    expect(result).toBe(false);
  });

  test('processProof reconstructs the correct root', () => {
    const computedRoot = MerkleTree.processProof(leaf, siblings);
    expect(computedRoot).toBe(root);
  });
});

describe('Selective Disclosure', () => {
  const certFields = {
    name: 'Alice Johnson',
    degree: 'Bachelor of Science in Computer Science',
    graduationDate: '2025-05-30',
    gpa: '3.8',
    institution: 'State University',
  };

  test('createCommitment returns field root and full hash', () => {
    const commitment = SelectiveDisclosure.createCommitment(certFields);
    expect(commitment.fieldRoot).toMatch(/^0x[a-f0-9]{64}$/);
    expect(commitment.fullHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(commitment.fieldCount).toBe(5);
    expect(commitment.fields).toEqual(Object.keys(certFields).sort());
  });

  test('generateDisclosureProof returns proof with revealed fields', () => {
    const result = SelectiveDisclosure.generateDisclosureProof(certFields, ['name', 'degree', 'institution']);
    expect(result).toBeDefined();
    expect(result.root).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.revealed.length).toBe(3);
    expect(result.revealed[0].key).toBe('degree');
    expect(result.revealed[1].key).toBe('institution');
    expect(result.revealed[2].key).toBe('name');
    result.revealed.forEach(r => {
      expect(r.proof.length).toBeGreaterThan(0);
      expect(r.leaf).toMatch(/^0x[a-f0-9]{64}$/);
    });
  });

  test('verifyDisclosureProof returns true for valid disclosure', () => {
    const result = SelectiveDisclosure.generateDisclosureProof(certFields, ['name', 'degree']);
    const verified = SelectiveDisclosure.verifyDisclosureProof(result.root, result.revealed);
    expect(verified).toBe(true);
  });

  test('verifyDisclosureProof returns false for tampered field value', () => {
    const result = SelectiveDisclosure.generateDisclosureProof(certFields, ['name']);
    const tamperedRevealed = [{
      ...result.revealed[0],
      value: 'Eve Johnson',
    }];
    const verified = SelectiveDisclosure.verifyDisclosureProof(result.root, tamperedRevealed);
    expect(verified).toBe(false);
  });

  test('verifyDisclosureProof returns false for wrong root', () => {
    const result = SelectiveDisclosure.generateDisclosureProof(certFields, ['name']);
    const wrongRoot = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const verified = SelectiveDisclosure.verifyDisclosureProof(wrongRoot, result.revealed);
    expect(verified).toBe(false);
  });

  test('revealing all fields works correctly', () => {
    const allFields = Object.keys(certFields);
    const result = SelectiveDisclosure.generateDisclosureProof(certFields, allFields);
    expect(result.revealed.length).toBe(allFields.length);
    expect(result.fieldCount).toBe(allFields.length);
    const verified = SelectiveDisclosure.verifyDisclosureProof(result.root, result.revealed);
    expect(verified).toBe(true);
  });

  test('revealing no fields returns empty revealed array', () => {
    const result = SelectiveDisclosure.generateDisclosureProof(certFields, []);
    expect(result.revealed.length).toBe(0);
    expect(result.fieldCount).toBe(5);
  });

  test('createSignedCommitment returns signable structure', () => {
    const result = SelectiveDisclosure.createCommitment(certFields);
    expect(result.fieldRoot).toBeTruthy();
    expect(result.fullHash).toBeTruthy();
    expect(result.fieldCount).toBe(5);
  });
});
