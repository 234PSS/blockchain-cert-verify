// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";

contract CertificateRegistryV2 is Initializable, UUPSUpgradeable, PausableUpgradeable, AccessControlUpgradeable {
    using MerkleProofUpgradeable for bytes32[];

    uint256 public constant MAX_BATCH_SIZE = 500;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Issuer {
        string name;
        string domain;
        bool active;
        uint256 registeredAt;
    }

    struct Certificate {
        bytes32 certificateHash;
        address issuer;
        uint256 issuedAt;
        bool revoked;
    }

    mapping(address => Issuer) private _issuers;
    address[] private _issuerAddresses;

    mapping(bytes32 => Certificate) private _certificates;
    bytes32[] private _certificateIds;

    mapping(address => bytes32) private _issuerMerkleRoots;
    mapping(address => uint256) private _issuerMerkleRootTimestamps;

    mapping(bytes32 => bool) private _usedNullifiers;
    mapping(address => bytes32[]) private _issuerMerkleRootHistory;

    event CertificateIssued(bytes32 indexed certificateId, bytes32 certificateHash, address indexed issuer);
    event CertificatesBatchIssued(uint256 count, address indexed issuer);
    event CertificateRevoked(bytes32 indexed certificateId, address indexed revoker);
    event CertificatesBatchRevoked(uint256 count, address indexed revoker);
    event IssuerRegistered(address indexed wallet, string name, string domain);
    event IssuerStatusUpdated(address indexed wallet, bool active);
    event MerkleRootUpdated(address indexed issuer, bytes32 merkleRoot);
    event ContractPaused(address pauser);
    event ContractUnpaused(address unpauser);
    event NullifierConsumed(bytes32 indexed nullifier, address indexed consumer);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) public initializer {
        __UUPSUpgradeable_init();
        __Pausable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // ========== MULTI-TENANT: ISSUER MANAGEMENT ==========

    function registerIssuer(
        string calldata _name,
        string calldata _domain
    ) external onlyRole(ISSUER_ROLE) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_domain).length > 0, "Domain required");
        require(_issuers[msg.sender].registeredAt == 0, "Already registered");

        _issuers[msg.sender] = Issuer({
            name: _name,
            domain: _domain,
            active: true,
            registeredAt: block.timestamp
        });
        _issuerAddresses.push(msg.sender);

        emit IssuerRegistered(msg.sender, _name, _domain);
    }

    function updateIssuerStatus(address _wallet, bool _active) external onlyRole(ADMIN_ROLE) {
        require(_issuers[_wallet].registeredAt != 0, "Issuer not found");
        _issuers[_wallet].active = _active;
        emit IssuerStatusUpdated(_wallet, _active);
    }

    function isIssuer(address _wallet) external view returns (bool) {
        return _issuers[_wallet].active;
    }

    function getIssuer(address _wallet) external view returns (Issuer memory) {
        require(_issuers[_wallet].registeredAt != 0, "Issuer not found");
        return _issuers[_wallet];
    }

    function getIssuerCount() external view returns (uint256) {
        return _issuerAddresses.length;
    }

    function getIssuerAt(uint256 _index) external view returns (address) {
        require(_index < _issuerAddresses.length, "Index out of bounds");
        return _issuerAddresses[_index];
    }

    function getAllIssuers() external view returns (address[] memory, Issuer[] memory) {
        uint256 len = _issuerAddresses.length;
        address[] memory addrs = new address[](len);
        Issuer[] memory issuerData = new Issuer[](len);
        for (uint256 i = 0; i < len; i++) {
            addrs[i] = _issuerAddresses[i];
            issuerData[i] = _issuers[_issuerAddresses[i]];
        }
        return (addrs, issuerData);
    }

    // ========== SINGLE CERTIFICATE OPERATIONS ==========

    function issueCertificate(
        bytes32 _certificateId,
        bytes32 _certificateHash
    ) external whenNotPaused onlyRole(ISSUER_ROLE) {
        require(_certificateId != bytes32(0), "Invalid certificate ID");
        require(_certificateHash != bytes32(0), "Invalid hash");
        require(_certificates[_certificateId].issuedAt == 0, "Already exists");
        require(_issuers[msg.sender].active, "Issuer not active");

        _certificates[_certificateId] = Certificate({
            certificateHash: _certificateHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false
        });
        _certificateIds.push(_certificateId);

        emit CertificateIssued(_certificateId, _certificateHash, msg.sender);
    }

    function revokeCertificate(bytes32 _certificateId) external whenNotPaused onlyRole(ISSUER_ROLE) {
        require(_certificates[_certificateId].issuedAt != 0, "Does not exist");
        require(!_certificates[_certificateId].revoked, "Already revoked");
        require(_certificates[_certificateId].issuer == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(_issuers[msg.sender].active || hasRole(ADMIN_ROLE, msg.sender), "Not active");

        _certificates[_certificateId].revoked = true;

        emit CertificateRevoked(_certificateId, msg.sender);
    }

    // ========== BATCH OPERATIONS (GAS-EFFICIENT) ==========

    function issueCertificatesBatch(
        bytes32[] calldata certIds,
        bytes32[] calldata certHashes
    ) external whenNotPaused onlyRole(ISSUER_ROLE) {
        uint256 len = certIds.length;
        require(len > 0, "Empty batch");
        require(len == certHashes.length, "Length mismatch");
        require(len <= MAX_BATCH_SIZE, "Batch exceeds max size");
        require(_issuers[msg.sender].active, "Issuer not active");

        for (uint256 i = 0; i < len; i++) {
            bytes32 certId = certIds[i];
            require(certId != bytes32(0), "Invalid cert ID");
            require(certHashes[i] != bytes32(0), "Invalid cert hash");
            require(_certificates[certId].issuedAt == 0, "Duplicate cert ID");

            _certificates[certId].certificateHash = certHashes[i];
            _certificates[certId].issuer = msg.sender;
            _certificates[certId].issuedAt = block.timestamp;
            _certificates[certId].revoked = false;
            _certificateIds.push(certId);
        }

        emit CertificatesBatchIssued(len, msg.sender);
    }

    function revokeCertificatesBatch(
        bytes32[] calldata certIds
    ) external whenNotPaused onlyRole(ISSUER_ROLE) {
        uint256 len = certIds.length;
        require(len > 0, "Empty batch");
        require(len <= MAX_BATCH_SIZE, "Batch exceeds max size");
        require(_issuers[msg.sender].active || hasRole(ADMIN_ROLE, msg.sender), "Not active");

        for (uint256 i = 0; i < len; i++) {
            bytes32 certId = certIds[i];
            require(_certificates[certId].issuedAt != 0, "Cert not found");
            require(!_certificates[certId].revoked, "Already revoked");
            require(
                _certificates[certId].issuer == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
                "Not authorized"
            );

            _certificates[certId].revoked = true;
        }

        emit CertificatesBatchRevoked(len, msg.sender);
    }

    // ========== MERKLE TREE BATCH VERIFICATION ==========

    function updateMerkleRoot(bytes32 _merkleRoot) external whenNotPaused onlyRole(ISSUER_ROLE) {
        require(_merkleRoot != bytes32(0), "Invalid root");
        require(_issuers[msg.sender].active, "Issuer not active");
        _issuerMerkleRoots[msg.sender] = _merkleRoot;
        _issuerMerkleRootTimestamps[msg.sender] = block.timestamp;
        _issuerMerkleRootHistory[msg.sender].push(_merkleRoot);
        emit MerkleRootUpdated(msg.sender, _merkleRoot);
    }

    function verifyByMerkleProof(
        bytes32 _leaf,
        bytes32[] calldata _proof,
        address _issuer
    ) external view returns (bool) {
        bytes32 root = _issuerMerkleRoots[_issuer];
        if (root == bytes32(0)) return false;
        return MerkleProofUpgradeable.verify(_proof, root, _leaf);
    }

    function getIssuerMerkleRoot(address _issuer) external view returns (bytes32, uint256) {
        return (_issuerMerkleRoots[_issuer], _issuerMerkleRootTimestamps[_issuer]);
    }

    function getIssuerMerkleRootHistoryLength(address _issuer) external view returns (uint256) {
        return _issuerMerkleRootHistory[_issuer].length;
    }

    function getIssuerMerkleRootHistoryAt(address _issuer, uint256 _index) external view returns (bytes32) {
        require(_index < _issuerMerkleRootHistory[_issuer].length, "Index out of bounds");
        return _issuerMerkleRootHistory[_issuer][_index];
    }

    // ========== VERIFICATION ==========

    function verifyCertificate(bytes32 _certificateId)
        external
        view
        returns (bool valid, bytes32 certificateHash, address issuer, uint256 issuedAt, bool revoked)
    {
        Certificate storage cert = _certificates[_certificateId];
        if (cert.issuedAt == 0) {
            return (false, bytes32(0), address(0), 0, false);
        }
        return (true, cert.certificateHash, cert.issuer, cert.issuedAt, cert.revoked);
    }

    function getCertificate(bytes32 _certificateId)
        external
        view
        returns (Certificate memory)
    {
        require(_certificates[_certificateId].issuedAt != 0, "Does not exist");
        return _certificates[_certificateId];
    }

    function getCertificateCount() external view returns (uint256) {
        return _certificateIds.length;
    }

    function getCertificateAt(uint256 _index) external view returns (bytes32) {
        require(_index < _certificateIds.length, "Index out of bounds");
        return _certificateIds[_index];
    }

    function getCertificatesByIssuer(address _issuer) external view returns (bytes32[] memory) {
        uint256 count;
        uint256 total = _certificateIds.length;
        for (uint256 i = 0; i < total; i++) {
            if (_certificates[_certificateIds[i]].issuer == _issuer) {
                count++;
            }
        }

        bytes32[] memory result = new bytes32[](count);
        uint256 idx;
        for (uint256 i = 0; i < total; i++) {
            if (_certificates[_certificateIds[i]].issuer == _issuer) {
                result[idx] = _certificateIds[i];
                idx++;
            }
        }
        return result;
    }

    // ========== CIRCUIT BREAKER (PAUSE) ==========

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    // ========== REPLAY PROTECTION (NULLIFIERS) ==========

    function consumeNullifier(bytes32 _nullifier) external whenNotPaused {
        require(_nullifier != bytes32(0), "Invalid nullifier");
        require(!_usedNullifiers[_nullifier], "Nullifier already used");
        _usedNullifiers[_nullifier] = true;
        emit NullifierConsumed(_nullifier, msg.sender);
    }

    function isNullifierUsed(bytes32 _nullifier) external view returns (bool) {
        return _usedNullifiers[_nullifier];
    }

    function verifyWithNullifier(
        bytes32 _leaf,
        bytes32[] calldata _proof,
        address _issuer,
        bytes32 _nullifier
    ) external whenNotPaused returns (bool) {
        require(!_usedNullifiers[_nullifier], "Nullifier already used");
        bytes32 root = _issuerMerkleRoots[_issuer];
        if (root == bytes32(0)) return false;
        bool valid = MerkleProofUpgradeable.verify(_proof, root, _leaf);
        if (valid) {
            _usedNullifiers[_nullifier] = true;
            emit NullifierConsumed(_nullifier, msg.sender);
        }
        return valid;
    }

    // ========== V1 BACKWARD-COMPATIBLE HELPERS ==========

    function computeCertificateId(
        string calldata _studentId,
        string calldata _courseId,
        uint256 _graduationDate
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_studentId, _courseId, _graduationDate));
    }

    function hashCertificateData(
        string calldata _studentName,
        string calldata _studentId,
        string calldata _courseName,
        string calldata _courseId,
        string calldata _institution,
        uint256 _graduationDate,
        string calldata _certificateHash
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(
            _studentName, _studentId, _courseName, _courseId,
            _institution, _graduationDate, _certificateHash
        ));
    }
}
