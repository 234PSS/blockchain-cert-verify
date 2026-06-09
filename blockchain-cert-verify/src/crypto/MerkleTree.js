const { ethers } = require('ethers');
const { hashPair } = require('./hash');

class MerkleTree {
  constructor(leaves) {
    this.leaves = leaves.map(l => this._toBytes32(l));
    this.layers = this._buildLayers(this.leaves);
    this.root = this.layers.length > 0 ? this.layers[this.layers.length - 1][0] : null;
  }

  _toBytes32(value) {
    if (typeof value === 'string' && value.startsWith('0x') && value.length === 66) {
      return ethers.getBytes(value);
    }
    return ethers.getBytes(ethers.keccak256(ethers.toUtf8Bytes(String(value))));
  }

  _toHex(bytes) {
    return ethers.hexlify(bytes);
  }

  _buildLayers(leaves) {
    if (leaves.length === 0) return [];
    const layers = [leaves];

    while (layers[layers.length - 1].length > 1) {
      const currentLayer = layers[layers.length - 1];
      const nextLayer = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = this._toHex(currentLayer[i]);
        const right = i + 1 < currentLayer.length
          ? this._toHex(currentLayer[i + 1])
          : left;
        nextLayer.push(ethers.getBytes(hashPair(left, right)));
      }

      layers.push(nextLayer);
    }

    return layers;
  }

  getRoot() {
    return this.root ? this._toHex(this.root) : null;
  }

  getHexLeaves() {
    return this.leaves.map(l => this._toHex(l));
  }

  getProof(leaf) {
    const leafHex = leaf.startsWith('0x') && leaf.length === 66
      ? leaf
      : this._toHex(ethers.keccak256(ethers.toUtf8Bytes(String(leaf))));

    let index = this.leaves.findIndex(l => this._toHex(l) === leafHex);
    if (index === -1) {
      const hexLeaves = this.leaves.map(l => this._toHex(l));
      index = hexLeaves.indexOf(leafHex);
    }
    if (index === -1) {
      throw new Error('Leaf not found in tree');
    }

    const proof = [];
    for (let layerIdx = 0; layerIdx < this.layers.length - 1; layerIdx++) {
      const layer = this.layers[layerIdx];
      const pairIndex = index % 2 === 0 ? index + 1 : index - 1;

      if (pairIndex < layer.length) {
        proof.push(this._toHex(layer[pairIndex]));
      } else {
        proof.push(this._toHex(layer[index]));
      }

      index = Math.floor(index / 2);
    }

    return proof;
  }

  static verify(leaf, proof, root) {
    let computedHash = leaf.startsWith('0x') ? leaf : ethers.keccak256(ethers.toUtf8Bytes(String(leaf)));

    for (const proofElement of proof) {
      computedHash = hashPair(computedHash, proofElement);
    }

    return computedHash === root;
  }

  static processProof(leaf, proof) {
    let computedHash = leaf.startsWith('0x') ? leaf : ethers.keccak256(ethers.toUtf8Bytes(String(leaf)));

    for (const proofElement of proof) {
      computedHash = hashPair(computedHash, proofElement);
    }

    return computedHash;
  }
}

module.exports = MerkleTree;
