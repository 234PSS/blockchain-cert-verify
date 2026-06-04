const { Certificate, Student, Course, Institution, VerificationLog } = require('../models');
const blockchainService = require('../services/blockchainService');
const CryptoJS = require('crypto-js');

const generateCertificateHash = (data) => {
  return CryptoJS.SHA256(JSON.stringify(data)).toString();
};

exports.issueCertificate = async (req, res) => {
  try {
    const { studentId, courseId, institutionId, grade, remarks } = req.body;
    
    const student = await Student.findByPk(studentId);
    const course = await Course.findByPk(courseId);
    
    if (!student || !course) {
      return res.status(404).json({ success: false, message: 'Student or course not found' });
    }
    
    const certificateData = {
      student_id: studentId,
      course_id: courseId,
      institution_id: institutionId,
      certificate_hash: generateCertificateHash({ studentId, courseId, institutionId }),
      grade,
      remarks
    };

    const certificate = await Certificate.create(certificateData);
    
    const tx = await blockchainService.issueCertificate({
      studentName: student.User?.name || 'Unknown',
      studentId: student.student_number,
      courseName: course.course_name,
      courseId: course.course_code,
      institution: (await Institution.findByPk(institutionId))?.name || 'Unknown',
      graduationDate: student.graduation_date || new Date(),
      certificateHash: certificate.certificate_hash
    });

    await certificate.update({ blockchain_tx_hash: tx.hash });
    const blockchainId = tx.logs?.[0]?.topics?.[1];
    if (blockchainId) {
      await certificate.update({ blockchain_certificate_id: blockchainId });
    }

    res.status(201).json({
      success: true,
      certificate,
      transactionHash: tx.hash
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const certificate = await Certificate.findByPk(certificateId, {
      include: [Student, Course, Institution]
    });
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const [exists, hash, inst] = await blockchainService.verifyCertificate(certificate.blockchain_certificate_id);
    
    await VerificationLog.create({
      certificate_id: certificate.certificate_id,
      verification_status: exists && !certificate.is_revoked ? 'valid' : 'revoked',
      blockchain_verification: true
    });

    res.json({
      success: true,
      valid: exists && !certificate.is_revoked,
      certificateHash: hash,
      institution: inst,
      certificate
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStudentCertificates = async (req, res) => {
  try {
    const { studentId } = req.params;
    const certificates = await Certificate.findAll({
      where: { student_id: studentId },
      include: [Course, Institution]
    });
    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.revokeCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { reason } = req.body;
    
    const certificate = await Certificate.findByPk(certificateId);
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const tx = await blockchainService.revokeCertificate(certificate.blockchain_certificate_id);
    
    await certificate.update({ 
      is_revoked: true, 
      revoked_at: new Date(), 
      revoked_reason: reason 
    });

    res.json({ success: true, message: 'Certificate revoked', transactionHash: tx.hash });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.listAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.findAll({
      include: [Student, Course, Institution]
    });
    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};