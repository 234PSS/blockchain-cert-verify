const { Certificate, Student, Course, Institution, VerificationLog, User } = require('../models');
const blockchainService = require('../services/blockchainService');
const CryptoJS = require('crypto-js');

const generateCertificateHash = (data) => {
  return CryptoJS.SHA256(JSON.stringify(data)).toString();
};

exports.issueCertificate = async (req, res) => {
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