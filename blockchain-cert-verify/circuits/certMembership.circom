pragma circom 2.1.0;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/merkle/MerkleTreeProcessor.circom";

template CertMembershipProof(nLevels) {
    signal input leaf;
    signal input root;
    signal input siblings[nLevels];
    signal input indices[nLevels];

    signal output valid;

    component merkleProcessor = MerkleTreeProcessor(nLevels);
    merkleProcessor.leaf <== leaf;
    merkleProcessor.root <== root;

    for (var i = 0; i < nLevels; i++) {
        merkleProcessor.siblings[i] <== siblings[i];
        merkleProcessor.indices[i] <== indices[i];
    }

    valid <== merkleProcessor.valid;
}

template SelectiveFieldReveal(nFields) {
    signal input fieldRoot;
    signal input fieldValues[nFields];
    signal input fieldIndices[nFields];
    signal input revealFlags[nFields];
    signal input siblings[nFields][10];
    signal input indices[nFields][10];

    signal output valid;

    component hasher[nFields];
    component merkleProcessors[nFields];

    var totalValid = 0;

    for (var i = 0; i < nFields; i++) {
        hasher[i] = Poseidon(2);
        hasher[i].inputs[0] <== fieldIndices[i];
        hasher[i].inputs[1] <== fieldValues[i];

        merkleProcessors[i] = MerkleTreeProcessor(10);
        merkleProcessors[i].leaf <== hasher[i].out;
        merkleProcessors[i].root <== fieldRoot;

        for (var j = 0; j < 10; j++) {
            merkleProcessors[i].siblings[j] <== siblings[i][j];
            merkleProcessors[i].indices[j] <== indices[i][j];
        }

        component andGate = AND();
        andGate.a <== revealFlags[i];
        andGate.b <== merkleProcessors[i].valid;
        totalValid += andGate.out;
    }

    component eq = IsEqual();
    eq.in[0] <== totalValid;
    eq.in[1] <== nFields;
    valid <== eq.out;
}

component main = CertMembershipProof(16);
