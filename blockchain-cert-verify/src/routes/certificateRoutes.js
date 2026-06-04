const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/issue', authenticate, authorize('university_staff', 'admin'), certificateController.issueCertificate);
router.get('/verify/:certificateId', certificateController.verifyCertificate);
router.get('/student/:studentId', authenticate, certificateController.getStudentCertificates);
router.put('/revoke/:certificateId', authenticate, authorize('university_staff', 'admin'), certificateController.revokeCertificate);
router.get('/all', authenticate, authorize('admin'), certificateController.listAllCertificates);

module.exports = router;