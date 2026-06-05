const { Certificate, Student, Course, Institution, VerificationLog, User } = require('../models');
const AppError = require('../utils/AppError');
const blockchainService = require('../services/blockchainService');
const certificateFileService = require('../services/certificateFileService');

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
