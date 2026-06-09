const CertificateRegistry = artifacts.require("CertificateRegistry");

contract("CertificateRegistry", (accounts) => {
  const [owner, university, student] = accounts;
  let registry;

  beforeEach(async () => {
    // Deploy a fresh contract for each test
    registry = await CertificateRegistry.new({ from: owner });
  });

  it("should initialize with the deployer (owner) authorized", async () => {
    const isOwnerAuthorized = await registry.isAuthorized(owner);
    assert.equal(isOwnerAuthorized, true, "Owner should be authorized by default");
  });

  it("should allow owner to authorize a university", async () => {
    await registry.authorizeUniversity(university, true, { from: owner });
    const isUnivAuthorized = await registry.isAuthorized(university);
    assert.equal(isUnivAuthorized, true, "University should be successfully authorized");
  });

  it("should prevent non-owners from authorizing a university", async () => {
    try {
      await registry.authorizeUniversity(student, true, { from: university });
      assert.fail("Should have failed with owner validation error");
    } catch (error) {
      assert(
        error.message.includes("Caller is not the owner") || error.message.includes("revert"),
        "Expected revert with owner validation error"
      );
    }
  });

  it("should allow authorized university to issue a certificate", async () => {
    await registry.authorizeUniversity(university, true, { from: owner });

    const studentName = "Jane Doe";
    const studentId = "STD-2026-908";
    const courseName = "Distributed Ledger Systems";
    const courseId = "CS-402";
    const institutionName = "Blockchain University";
    const graduationDate = Math.floor(Date.now() / 1000);
    const certificateHash = "0x" + "1".repeat(64);

    const tx = await registry.issueCertificate(
      studentName,
      studentId,
      courseName,
      courseId,
      institutionName,
      graduationDate,
      certificateHash,
      { from: university }
    );

    // Get certificate ID from emission logs
    const certEvent = tx.logs.find(log => log.event === "CertificateIssued");
    assert.ok(certEvent, "CertificateIssued event should be emitted");
    const certificateId = certEvent.args.certificateId;

    const [exists, hash, inst] = await registry.verifyCertificate(certificateId);
    assert.equal(exists, true, "Certificate should exist");
    assert.equal(hash, certificateHash, "Certificate hash should match");
    assert.equal(inst, institutionName, "Institution name should match");
  });

  it("should allow authorized university to revoke a certificate", async () => {
    await registry.authorizeUniversity(university, true, { from: owner });

    const studentName = "Bob Smith";
    const studentId = "STD-2026-909";
    const courseName = "Solidity Smart Contracts";
    const courseId = "CS-403";
    const institutionName = "Solidity Institute";
    const graduationDate = Math.floor(Date.now() / 1000);
    const certificateHash = "0x" + "2".repeat(64);

    const tx = await registry.issueCertificate(
      studentName,
      studentId,
      courseName,
      courseId,
      institutionName,
      graduationDate,
      certificateHash,
      { from: university }
    );

    const certEvent = tx.logs.find(log => log.event === "CertificateIssued");
    const certificateId = certEvent.args.certificateId;

    // Revoke
    await registry.revokeCertificate(certificateId, { from: university });

    const [exists, hash, inst] = await registry.verifyCertificate(certificateId);
    assert.equal(exists, false, "Certificate should no longer be verified (exists = false)");
  });
});
