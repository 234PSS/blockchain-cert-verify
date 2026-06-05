// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CertificateRegistry {
    struct Certificate {
        string studentName;
        string studentId;
        string courseName;
        string courseId;
        string institution;
        uint256 graduationDate;
        string certificateHash;
        bool exists;
    }

    mapping(bytes32 => Certificate) private certificates;
    mapping(address => bool) private authorizedUniversities;

    event CertificateIssued(bytes32 indexed certificateId, string studentId, address issuer);
    event CertificateRevoked(bytes32 indexed certificateId, address revoker);
    event UniversityAuthorized(address university, bool authorized);

    constructor() {
        authorizedUniversities[msg.sender] = true;
    }

    modifier onlyAuthorized() {
        require(authorizedUniversities[msg.sender], "Not authorized");
        _;
    }

    function authorizeUniversity(address university, bool authorized) external onlyAuthorized {
        authorizedUniversities[university] = authorized;
        emit UniversityAuthorized(university, authorized);
    }

    function issueCertificate(
        string memory _studentName,
        string memory _studentId,
        string memory _courseName,
        string memory _courseId,
        string memory _institution,
        uint256 _graduationDate,
        string memory _certificateHash
    ) external onlyAuthorized returns (bytes32) {
        bytes32 certificateId = keccak256(abi.encodePacked(_studentId, _courseId, _graduationDate));
        require(!certificates[certificateId].exists, "Certificate already exists");

        certificates[certificateId] = Certificate({
            studentName: _studentName,
            studentId: _studentId,
            courseName: _courseName,
            courseId: _courseId,
            institution: _institution,
            graduationDate: _graduationDate,
            certificateHash: _certificateHash,
            exists: true
        });

        emit CertificateIssued(certificateId, _studentId, msg.sender);
        return certificateId;
    }

    function revokeCertificate(bytes32 certificateId) external onlyAuthorized {
        require(certificates[certificateId].exists, "Certificate does not exist");
        certificates[certificateId].exists = false;
        emit CertificateRevoked(certificateId, msg.sender);
    }

    function verifyCertificate(bytes32 certificateId)
        external
        view
        returns (bool valid, string memory certificateHash, string memory institution)
    {
        Certificate memory cert = certificates[certificateId];
        if (!cert.exists) {
            return (false, "", "");
        }
        return (true, cert.certificateHash, cert.institution);
    }

    function getCertificate(bytes32 certificateId)
        external
        view
        onlyAuthorized
        returns (Certificate memory)
    {
        require(certificates[certificateId].exists, "Certificate does not exist");
        return certificates[certificateId];
    }

    function isAuthorized(address university) external view returns (bool) {
        return authorizedUniversities[university];
    }
}
