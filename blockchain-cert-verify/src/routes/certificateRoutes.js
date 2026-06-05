const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../validators/rules');
const { issueSchema, revokeSchema } = require('../validators/certificateValidators');
const { uploadCertificateDocument } = require('../middleware/uploadMiddleware');

router.post(
  '/issue',
  authenticate,
  authorize('university_staff', 'admin'),
  uploadCertificateDocument,
  validate(issueSchema),
  asyncHandler(certificateController.issueCertificate)
);

router.get(
  '/verify/:certificateId',
  parseId('certificateId'),
  asyncHandler(certificateController.verifyCertificate)
);

router.get(
  '/me',
  authenticate,
  authorize('student'),
  asyncHandler(certificateController.getMyCertificates)
);

router.get(
  '/student/:studentId',
  authenticate,
  authorize('admin', 'university_staff'),
  parseId('studentId'),
  asyncHandler(certificateController.getStudentCertificates)
);

router.put(
  '/revoke/:certificateId',
  authenticate,
  authorize('university_staff', 'admin'),
  parseId('certificateId'),
  validate(revokeSchema),
  asyncHandler(certificateController.revokeCertificate)
);

router.get(
  '/all',
  authenticate,
  authorize('admin'),
  asyncHandler(certificateController.listAllCertificates)
);

module.exports = router;
