const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const rateLimit = require('../middleware/rateLimitMiddleware');

router.post('/issue', authenticate, authorize('university_staff', 'admin'), certificateController.issueCertificate);
router.get('/verify/:certificateId', rateLimit(60, 1 * 60 * 1000), certificateController.verifyCertificate); // Max 60 requests per minute
router.get('/student/:studentId', authenticate, certificateController.getStudentCertificates);
router.put('/revoke/:certificateId', authenticate, authorize('university_staff', 'admin'), certificateController.revokeCertificate);
router.get('/all', authenticate, authorize('admin'), certificateController.listAllCertificates);

router.get('/students', authenticate, authorize('university_staff', 'admin'), certificateController.listStudents);
router.get('/courses', authenticate, authorize('university_staff', 'admin'), certificateController.listCourses);
router.post('/courses', authenticate, authorize('university_staff', 'admin'), certificateController.createCourse);

module.exports = router;