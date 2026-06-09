/**
 * Merkle tree helpers aligned with OpenZeppelin MerkleProof and src/crypto/hash.js.
 * Uses keccak256(concat(bytes32, bytes32)) for internal nodes (sorted pair hashing).
 */

function sortBytes32(a, b) {
  const aBN = web3.utils.toBN(a.slice(2), 16);
  const bBN = web3.utils.toBN(b.slice(2), 16);
  return aBN.lt(bBN) ? [a, b] : [b, a];
}

function hashPair(a, b) {
  const [left, right] = sortBytes32(a, b);
  // Matches OZ _efficientHash / ethers.concat — NOT abi.encode padding differences.
  return web3.utils.keccak256('0x' + left.slice(2) + right.slice(2));
}

function buildMerkleTree(leaves) {
  if (leaves.length === 0) return { root: null, layers: [] };
  let currentLayer = leaves;
  const layers = [currentLayer];

  while (currentLayer.length > 1) {
    const nextLayer = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
      nextLayer.push(hashPair(left, right));
    }
    layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  return { root: currentLayer[0], layers };
}

function getMerkleProof(leaves, targetIndex) {
  const { layers } = buildMerkleTree(leaves);
  const proof = [];
  let idx = targetIndex;

  for (let layerIdx = 0; layerIdx < layers.length - 1; layerIdx++) {
    const layer = layers[layerIdx];
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    if (pairIdx < layer.length) {
      proof.push(layer[pairIdx]);
    } else {
      // Odd-length layer: duplicated sibling (matches src/crypto/MerkleTree.js).
      proof.push(layer[idx]);
    }
    idx = Math.floor(idx / 2);
  }

  return proof;
}

module.exports = { sortBytes32, hashPair, buildMerkleTree, getMerkleProof };
