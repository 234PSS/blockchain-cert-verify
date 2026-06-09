const { Certificate, Student, Course, Institution, VerificationLog, User } = require('../models');
const { ethers } = require('ethers');
const { Certificate, Student, Course, Institution, VerificationLog, User } = require('../models');
const AppError = require('../utils/AppError');
const blockchainService = require('../services/blockchainService');
const certificateFileService = require('../services/certificateFileService');
const MerkleTree = require('../crypto/MerkleTree');
const CertificateCommitment = require('../crypto/commitment');
const SelectiveDisclosure = require('../crypto/selectiveDisclosure');

const getVerifierIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

const ensureBlockchainReady = () => {
  if (!blockchainService.isReady()) {
    throw new AppError(
      blockchainService.getUnavailableReason() || 'Blockchain service is not available',
      503
    );
  }
};

const parseBodyInt = (value, fieldName) => {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }
  return num;
};

exports.issueCertificate = async (req, res) => {
  const studentId = parseBodyInt(req.body.studentId, 'studentId');
  const courseId = parseBodyInt(req.body.courseId, 'courseId');
  const institutionId = parseBodyInt(req.body.institutionId, 'institutionId');
  const { grade, remarks } = req.body;

  const student = await Student.findByPk(studentId, {
    include: [{ model: User, attributes: ['name'] }]
  });
  const course = await Course.findByPk(courseId);
  const institution = await Institution.findByPk(institutionId);

  if (!student) throw new AppError('Student not found', 404);
  if (!course) throw new AppError('Course not found', 404);
  if (!institution) throw new AppError('Institution not found', 404);

  if (req.user.role === 'university_staff' && !institution.is_verified) {
    throw new AppError('Institution must be verified before issuing certificates', 403);
  }

  if (course.institution_id && course.institution_id !== institutionId) {
    throw new AppError('Course does not belong to the specified institution', 400);
  }

  ensureBlockchainReady();

  const documentHash = certificateFileService.hashFile(req.file.path);
  const metadata = {
    studentId,
    courseId,
    institutionId,
    studentNumber: student.student_number,
    courseCode: course.course_code,
    institutionName: institution.name,
    grade: grade || null,
    remarks: remarks || null,
    issuedAt: new Date().toISOString()
  };
  const certificateHash = certificateFileService.hashCertificateRecord(metadata, documentHash);
  const documentPath = certificateFileService.toRelativePath(req.file.path);

  let certificate;
  try {
    const { studentId, courseId, grade, remarks } = req.body;
    
    const staffUser = await User.findByPk(req.user.id);
    if (!staffUser || !staffUser.wallet_address) {
      return res.status(403).json({ success: false, message: 'User is not associated with a wallet address' });
    }

    const institution = await Institution.findOne({ where: { wallet_address: staffUser.wallet_address } });
    if (!institution) {
      return res.status(403).json({ success: false, message: 'Staff wallet address is not associated with a registered institution' });
    }
    if (!institution.is_verified) {
      return res.status(403).json({ success: false, message: 'Institution is not verified by admin' });
    }

    const student = await Student.findByPk(studentId, { include: [User] });
    const course = await Course.findByPk(courseId);
    
    if (!student || !course) {
      return res.status(404).json({ success: false, message: 'Student or course not found' });
    }
    
    const certificateData = {
      student_id: studentId,
      course_id: courseId,
      institution_id: institution.institution_id,
      certificate_hash: generateCertificateHash({ studentId, courseId, institutionId: institution.institution_id }),
      grade,
      remarks
    };

    const certificate = await Certificate.create(certificateData);
    
    const tx = await blockchainService.issueCertificate({
      studentName: student.User?.name || 'Unknown',
      studentId: student.student_number,
      courseName: course.course_name,
      courseId: course.course_code,
      institution: institution.name,
      graduationDate: student.graduation_date || new Date(),
      certificateHash: certificate.certificate_hash
    certificate = await Certificate.create({
      student_id: studentId,
      course_id: courseId,
      institution_id: institutionId,
      certificate_hash: certificateHash,
      document_path: documentPath,
      document_original_name: req.file.originalname,
      document_mime_type: req.file.mimetype,
      document_hash: documentHash,
      grade: grade || null,
      remarks: remarks || null
    });

    const { certificateId: blockchainCertificateId, hash: transactionHash } =
      await blockchainService.issueCertificate({
        studentName: student.User?.name || 'Unknown',
        studentId: student.student_number,
        courseName: course.course_name,
        courseId: course.course_code,
        institution: institution.name,
        graduationDate: student.graduation_date || new Date(),
        certificateHash
      });

    const qrCodePath = await certificateFileService.generateQrCode(certificate.certificate_id);

    await certificate.update({
      blockchain_tx_hash: transactionHash,
      blockchain_certificate_id: blockchainCertificateId,
      qr_code_path: qrCodePath
    });

    await certificate.reload();
    const formatted = certificateFileService.formatCertificate(certificate);

    res.status(201).json({
      success: true,
      certificate: formatted,
      filePath: formatted.filePath,
      qrPath: formatted.qrPath,
      verificationUrl: formatted.verificationUrl,
      transactionHash
    });
  } catch (error) {
    if (certificate) {
      certificateFileService.removeStoredFile(certificate.document_path);
      certificateFileService.removeStoredFile(certificate.qr_code_path);
      await certificate.destroy();
    } else {
      certificateFileService.cleanupUploadedFile(req.file);
    }
    throw error;
  }
};

exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    let certificate;
    if (certificateId.length === 66) {
      certificate = await Certificate.findOne({
        where: { certificate_hash: certificateId },
        include: [
          { model: Student, include: [User] },
          Course,
          Institution
        ]
      });
    } else {
      certificate = await Certificate.findByPk(certificateId, {
        include: [
          { model: Student, include: [User] },
          Course,
          Institution
        ]
      });
    }
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const [exists, hash, inst] = await blockchainService.verifyCertificate(certificate.blockchain_certificate_id);
    
    let status = 'valid';
    if (!exists) {
      status = 'not_found';
    } else if (certificate.is_revoked) {
      status = 'revoked';
    }

    await VerificationLog.create({
      certificate_id: certificate.certificate_id,
      verification_status: status,
      blockchain_verification: true
  const certificateId = req.params.certificateId;

  const certificate = await Certificate.findByPk(certificateId, {
    include: [
      { model: Student, include: [{ model: User, attributes: ['name'] }] },
      Course,
      Institution
    ]
  });

  if (!certificate) {
    await VerificationLog.create({
      certificate_id: null,
      verifier_ip: getVerifierIp(req),
      verification_status: 'not_found',
      blockchain_verification: false,
      error_message: `Certificate ${certificateId} not found`
    });
    throw new AppError('Certificate not found', 404);
  }

  const formatted = certificateFileService.formatCertificate(certificate);

  if (certificate.is_revoked) {
    await VerificationLog.create({
      certificate_id: certificate.certificate_id,
      verifier_ip: getVerifierIp(req),
      verification_status: 'revoked',
      blockchain_verification: false
    });

    return res.json({
      success: true,
      valid: false,
      status: 'revoked',
      message: 'Certificate has been revoked',
      filePath: formatted.filePath,
      qrPath: formatted.qrPath,
      verificationUrl: formatted.verificationUrl,
      certificate: formatted
    });
  }

  let onChainValid = false;
  let chainHash = null;
  let chainInstitution = null;
  let blockchainVerification = false;

  if (blockchainService.isReady() && certificate.blockchain_certificate_id) {
    try {
      const { valid: exists, certificateHash: hash, institution: inst } =
        await blockchainService.verifyCertificate(certificate.blockchain_certificate_id);
      onChainValid = exists;
      chainHash = hash;
      chainInstitution = inst;
      blockchainVerification = true;
    } catch {
      blockchainVerification = false;
    }
  }

  const hashMatches = chainHash ? chainHash === certificate.certificate_hash : null;
  const valid = onChainValid && (hashMatches === null || hashMatches === true);

  const verificationStatus = valid ? 'valid' : 'invalid';

  await VerificationLog.create({
    certificate_id: certificate.certificate_id,
    verifier_ip: getVerifierIp(req),
    verification_status: verificationStatus,
    blockchain_verification: blockchainVerification,
    ...(!valid && { error_message: 'Certificate failed verification checks' })
  });

  res.json({
    success: true,
    valid,
    status: verificationStatus,
    certificateHash: certificate.certificate_hash,
    onChainHash: chainHash,
    institution: chainInstitution || certificate.Institution?.name,
    filePath: formatted.filePath,
    qrPath: formatted.qrPath,
    verificationUrl: formatted.verificationUrl,
    certificate: formatted
  });
};

exports.getMyCertificates = async (req, res) => {
  const student = await Student.findOne({ where: { user_id: req.user.id } });

  if (!student) {
    throw new AppError('Student profile not found', 404);
  }

  const certificates = await Certificate.findAll({
    where: { student_id: student.student_id },
    include: [Course, Institution],
    order: [['created_at', 'DESC']]
  });

  res.json({
    success: true,
    certificates: certificates.map(certificateFileService.formatCertificate)
  });
};

exports.getStudentCertificates = async (req, res) => {
  const studentId = req.params.studentId;

  const student = await Student.findByPk(studentId);
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  const certificates = await Certificate.findAll({
    where: { student_id: studentId },
    include: [Course, Institution],
    order: [['created_at', 'DESC']]
  });

  res.json({
    success: true,
    certificates: certificates.map(certificateFileService.formatCertificate)
  });
};

exports.revokeCertificate = async (req, res) => {
  const certificateId = req.params.certificateId;
  const { reason } = req.body;

  const certificate = await Certificate.findByPk(certificateId);
  if (!certificate) {
    throw new AppError('Certificate not found', 404);
  }

  if (certificate.is_revoked) {
    throw new AppError('Certificate is already revoked', 409);
  }

  ensureBlockchainReady();

  if (!certificate.blockchain_certificate_id) {
    throw new AppError('Certificate has no blockchain record to revoke', 400);
  }

  const { hash: transactionHash } = await blockchainService.revokeCertificate(
    certificate.blockchain_certificate_id
  );

  await certificate.update({
    is_revoked: true,
    revoked_at: new Date(),
    revoked_reason: reason
  });

  const formatted = certificateFileService.formatCertificate(certificate);

  res.json({
    success: true,
    message: 'Certificate revoked',
    filePath: formatted.filePath,
    qrPath: formatted.qrPath,
    transactionHash,
    certificate: formatted
  });
};

exports.listAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.findAll({
      include: [
        { model: Student, include: [User] },
        Course,
        Institution
      ]
    });
    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.listStudents = async (req, res) => {
  try {
    const students = await Student.findAll({ include: [User] });
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({ include: [Institution] });
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { courseCode, courseName, credits } = req.body;
    const staffUser = await User.findByPk(req.user.id);
    const institution = await Institution.findOne({ where: { wallet_address: staffUser.wallet_address } });
    
    if (!institution) {
      return res.status(403).json({ success: false, message: 'User is not associated with an institution' });
    }

    const course = await Course.create({
      course_code: courseCode,
      course_name: courseName,
      credits,
      institution_id: institution.institution_id
    });

    res.status(201).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
  const certificates = await Certificate.findAll({
    include: [
      { model: Student, include: [{ model: User, attributes: ['name', 'email'] }] },
      Course,
      Institution
    ],
    order: [['created_at', 'DESC']]
  });

  res.json({
    success: true,
    count: certificates.length,
    certificates: certificates.map(certificateFileService.formatCertificate)
  });
};

// ========== BATCH OPERATIONS ==========

exports.issueCertificatesBatch = async (req, res) => {
  const { certificates: certsData } = req.body;

  if (!Array.isArray(certsData) || certsData.length === 0) {
    throw new AppError('certificates must be a non-empty array', 400);
  }

  ensureBlockchainReady();

  const created = [];
  let batchFailed = false;

  for (const item of certsData) {
    const studentId = parseBodyInt(item.studentId, 'studentId');
    const courseId = parseBodyInt(item.courseId, 'courseId');
    const institutionId = parseBodyInt(item.institutionId, 'institutionId');
    const { grade, remarks } = item;

    const student = await Student.findByPk(studentId, {
      include: [{ model: User, attributes: ['name'] }]
    });
    const course = await Course.findByPk(courseId);
    const institution = await Institution.findByPk(institutionId);

    if (!student || !course || !institution) {
      batchFailed = true;
      throw new AppError(
        `Invalid student/course/institution for entry studentId=${studentId}`,
        400
      );
    }

    const metadata = {
      studentId,
      courseId,
      institutionId,
      studentNumber: student.student_number,
      courseCode: course.course_code,
      institutionName: institution.name,
      grade: grade || null,
      remarks: remarks || null,
      issuedAt: new Date().toISOString()
    };
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadata)));
    const certificateHash = certificateFileService.hashCertificateRecord(metadata, documentHash);

    created.push({
      studentId,
      courseId,
      institutionId,
      studentNumber: student.student_number,
      courseCode: course.course_code,
      institutionName: institution.name,
      certificateHash,
      studentName: student.User?.name || 'Unknown',
      graduationDate: student.graduation_date || new Date(),
      grade: grade || null,
      remarks: remarks || null
    });
  }

  if (batchFailed) return;

  const blockchainData = created.map(c => ({
    studentId: c.studentNumber,
    courseId: c.courseCode,
    graduationDate: c.graduationDate,
    certificateHash: c.certificateHash
  }));

  const { hash: transactionHash, certificateIds } =
    await blockchainService.issueCertificatesBatch(blockchainData);

  const dbCertificates = [];
  for (let i = 0; i < created.length; i++) {
    const c = created[i];
    const cert = await Certificate.create({
      student_id: c.studentId,
      course_id: c.courseId,
      institution_id: c.institutionId,
      certificate_hash: c.certificateHash,
      document_hash: c.certificateHash,
      grade: c.grade,
      remarks: c.remarks,
      blockchain_tx_hash: transactionHash,
      blockchain_certificate_id: certificateIds[i]
    });
    dbCertificates.push(certificateFileService.formatCertificate(cert));
  }

  res.status(201).json({
    success: true,
    count: dbCertificates.length,
    transactionHash,
    certificates: dbCertificates
  });
};

exports.revokeCertificatesBatch = async (req, res) => {
  const { certificateIds } = req.body;

  if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
    throw new AppError('certificateIds must be a non-empty array', 400);
  }

  ensureBlockchainReady();

  const certRecords = await Certificate.findAll({
    where: { blockchain_certificate_id: certificateIds }
  });

  if (certRecords.length !== certificateIds.length) {
    throw new AppError('One or more certificates not found on-chain', 404);
  }

  const { hash: transactionHash } = await blockchainService.revokeCertificatesBatch(
    certificateIds
  );

  const now = new Date();
  for (const cert of certRecords) {
    await cert.update({
      is_revoked: true,
      revoked_at: now
    });
  }

  res.json({
    success: true,
    message: `${certRecords.length} certificates revoked`,
    transactionHash,
    count: certRecords.length
  });
};

// ========== MERKLE TREE OPERATIONS ==========

exports.updateMerkleRoot = async (req, res) => {
  const { merkleRoot } = req.body;

  if (!merkleRoot || typeof merkleRoot !== 'string') {
    throw new AppError('merkleRoot is required', 400);
  }

  ensureBlockchainReady();

  const { hash: transactionHash } = await blockchainService.updateMerkleRoot(merkleRoot);

  res.json({
    success: true,
    merkleRoot,
    transactionHash
  });
};

exports.verifyMerkleProof = async (req, res) => {
  const { leaf, proof, issuerAddress } = req.body;

  if (!leaf || !proof || !issuerAddress) {
    throw new AppError('leaf, proof, and issuerAddress are required', 400);
  }

  ensureBlockchainReady();

  const valid = await blockchainService.verifyByMerkleProof(leaf, proof, issuerAddress);

  res.json({
    success: true,
    valid,
    leaf,
    issuerAddress
  });
};

exports.getIssuerMerkleRoot = async (req, res) => {
  const { issuerAddress } = req.params;

  if (!issuerAddress) {
    throw new AppError('issuerAddress is required', 400);
  }

  ensureBlockchainReady();

  const { root, timestamp } = await blockchainService.getIssuerMerkleRoot(issuerAddress);

  res.json({
    success: true,
    root,
    timestamp,
    issuerAddress
  });
};

// ========== ISSUER MANAGEMENT ==========

exports.registerIssuer = async (req, res) => {
  const { name, domain } = req.body;

  if (!name || !domain) {
    throw new AppError('name and domain are required', 400);
  }

  ensureBlockchainReady();

  const { hash: transactionHash } = await blockchainService.registerIssuer(name, domain);

  res.json({
    success: true,
    message: 'Issuer registered on-chain',
    transactionHash
  });
};

exports.getIssuers = async (req, res) => {
  ensureBlockchainReady();

  const issuers = await blockchainService.getAllIssuers();

  res.json({
    success: true,
    count: issuers.length,
    issuers
  });
};

exports.getIssuer = async (req, res) => {
  const { walletAddress } = req.params;

  if (!walletAddress) {
    throw new AppError('walletAddress is required', 400);
  }

  ensureBlockchainReady();

  const issuer = await blockchainService.getIssuer(walletAddress);

  res.json({
    success: true,
    issuer
  });
};

exports.updateIssuerStatus = async (req, res) => {
  const { walletAddress, active } = req.body;

  if (!walletAddress || active === undefined) {
    throw new AppError('walletAddress and active are required', 400);
  }

  ensureBlockchainReady();

  const { hash: transactionHash } = await blockchainService.updateIssuerStatus(
    walletAddress,
    Boolean(active)
  );

  res.json({
    success: true,
    message: `Issuer ${active ? 'activated' : 'deactivated'}`,
    transactionHash
  });
};

// ========== CIRCUIT BREAKER ==========

exports.pauseContract = async (req, res) => {
  ensureBlockchainReady();

  const { hash: transactionHash } = await blockchainService.pause();

  res.json({
    success: true,
    message: 'Contract paused',
    transactionHash
  });
};

exports.unpauseContract = async (req, res) => {
  ensureBlockchainReady();

  const { hash: transactionHash } = await blockchainService.unpause();

  res.json({
    success: true,
    message: 'Contract unpaused',
    transactionHash
  });
};

exports.getContractStatus = async (req, res) => {
  ensureBlockchainReady();

  const paused = await blockchainService.isPaused();
  const issuers = await blockchainService.getAllIssuers();

  res.json({
    success: true,
    paused,
    issuerCount: issuers.length,
    contractAddress: blockchainService.getContractAddress(),
    walletAddress: blockchainService.getStatus().walletAddress
  });
};

// ========== PRIVACY-PRESERVING VERIFICATION ==========

exports.generateSaltedCommitment = async (req, res) => {
  const { certificateId } = req.body;

  if (!certificateId) {
    throw new AppError('certificateId is required', 400);
  }

  const cert = await Certificate.findByPk(certificateId, {
    include: [
      { model: Student, include: [{ model: User, attributes: ['name'] }] },
      Course,
      Institution
    ]
  });
  if (!cert) throw new AppError('Certificate not found', 404);

  const certData = certificateFileService.formatCertificate(cert);
  const salt = CertificateCommitment.generateSalt();
  const { commitment, dataHash } = CertificateCommitment.createSaltedCommitment(certData, salt);

  res.json({
    success: true,
    commitment,
    dataHash,
    salt,
    certificateId
  });
};

exports.buildCertificateTree = async (req, res) => {
  const { certificateIds } = req.body;

  if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
    throw new AppError('certificateIds must be a non-empty array', 400);
  }

  const certificates = await Certificate.findAll({
    where: { certificate_id: certificateIds },
    include: [
      { model: Student, include: [{ model: User, attributes: ['name'] }] },
      Course,
      Institution
    ]
  });

  if (certificates.length !== certificateIds.length) {
    throw new AppError('One or more certificates not found', 404);
  }

  const batchData = certificates.map(cert => {
    const data = certificateFileService.formatCertificate(cert);
    const salt = CertificateCommitment.generateSalt();
    const { commitment } = CertificateCommitment.createSaltedCommitment(data, salt);
    return {
      certificateId: cert.certificate_id,
      data,
      salt,
      commitment
    };
  });

  const tree = new MerkleTree(batchData.map(b => b.commitment));
  const proofs = batchData.map(b => ({
    certificateId: b.certificateId,
    commitment: b.commitment,
    salt: b.salt,
    proof: tree.getProof(b.commitment)
  }));

  res.json({
    success: true,
    root: tree.getRoot(),
    leafCount: batchData.length,
    leaves: proofs
  });
};

exports.verifyPrivacyProof = async (req, res) => {
  const { leaf, proof, root } = req.body;

  if (!leaf || !proof || !root) {
    throw new AppError('leaf, proof, and root are required', 400);
  }

  const valid = MerkleTree.verify(leaf, proof, root);

  res.json({
    success: true,
    valid,
    leaf,
    root
  });
};

exports.verifyPrivacyProofOnChain = async (req, res) => {
  const { leaf, proof, issuerAddress } = req.body;

  if (!leaf || !proof || !issuerAddress) {
    throw new AppError('leaf, proof, and issuerAddress are required', 400);
  }

  ensureBlockchainReady();
  const valid = await blockchainService.verifyByMerkleProof(leaf, proof, issuerAddress);

  res.json({
    success: true,
    valid,
    leaf,
    issuerAddress
  });
};

exports.consumNullifier = async (req, res) => {
  const { nullifier } = req.body;

  if (!nullifier || typeof nullifier !== 'string') {
    throw new AppError('nullifier is required', 400);
  }

  ensureBlockchainReady();

  const tx = await blockchainService.contract.consumeNullifier(nullifier);
  const receipt = await tx.wait();

  res.json({
    success: true,
    nullifier,
    transactionHash: receipt.hash
  });
};

exports.verifyWithNullifier = async (req, res) => {
  const { leaf, proof, issuerAddress, nullifier } = req.body;

  if (!leaf || !proof || !issuerAddress || !nullifier) {
    throw new AppError('leaf, proof, issuerAddress, and nullifier are required', 400);
  }

  ensureBlockchainReady();

  const tx = await blockchainService.contract.verifyWithNullifier(
    leaf, proof, issuerAddress, nullifier
  );
  const receipt = await tx.wait();

  const valid = (() => {
    for (const log of receipt.logs) {
      try {
        const parsed = blockchainService.contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data
        });
        if (parsed?.name === 'NullifierConsumed') return true;
      } catch { /* ignore parse errors */ }
    }
    return false;
  })();

  res.json({
    success: true,
    valid,
    nullifier,
    leaf,
    issuerAddress,
    transactionHash: receipt.hash
  });
};

exports.generateSelectiveDisclosure = async (req, res) => {
  const { certificateId, fieldsToReveal } = req.body;

  if (!certificateId || !Array.isArray(fieldsToReveal) || fieldsToReveal.length === 0) {
    throw new AppError('certificateId and fieldsToReveal array are required', 400);
  }

  const cert = await Certificate.findByPk(certificateId, {
    include: [
      { model: Student, include: [{ model: User, attributes: ['name'] }] },
      Course,
      Institution
    ]
  });
  if (!cert) throw new AppError('Certificate not found', 404);

  const certData = certificateFileService.formatCertificate(cert);
  const disclosure = SelectiveDisclosure.generateDisclosureProof(certData, fieldsToReveal);

  res.json({
    success: true,
    root: disclosure.root,
    fieldCount: disclosure.fieldCount,
    revealed: disclosure.revealed.map(r => ({
      key: r.key,
      value: r.value,
      proof: r.proof
    }))
  });
};

exports.verifySelectiveDisclosure = async (req, res) => {
  const { root, revealedFields } = req.body;

  if (!root || !Array.isArray(revealedFields) || revealedFields.length === 0) {
    throw new AppError('root and revealedFields array are required', 400);
  }

  const valid = SelectiveDisclosure.verifyDisclosureProof(root, revealedFields);

  res.json({
    success: true,
    valid,
    root,
    revealedCount: revealedFields.length
  });
};
