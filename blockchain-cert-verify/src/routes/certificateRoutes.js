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
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../validators/rules');
const {
  issueSchema,
  revokeSchema,
  batchIssueSchema,
  batchRevokeSchema,
  merkleRootSchema,
  merkleProofSchema,
  registerIssuerSchema,
  privacyCommitmentSchema,
  privacyBuildTreeSchema,
  privacyVerifySchema,
  nullifierSchema
} = require('../validators/certificateValidators');
const { uploadCertificateDocument } = require('../middleware/uploadMiddleware');

// ---- Single certificate operations ----
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

// ---- Batch operations ----
router.post(
  '/batch/issue',
  authenticate,
  authorize('university_staff', 'admin'),
  validate(batchIssueSchema),
  asyncHandler(certificateController.issueCertificatesBatch)
);

router.post(
  '/batch/revoke',
  authenticate,
  authorize('admin', 'university_staff'),
  validate(batchRevokeSchema),
  asyncHandler(certificateController.revokeCertificatesBatch)
);

// ---- Merkle tree operations ----
router.post(
  '/merkle/root',
  authenticate,
  authorize('university_staff', 'admin'),
  validate(merkleRootSchema),
  asyncHandler(certificateController.updateMerkleRoot)
);

router.post(
  '/merkle/verify',
  authenticate,
  authorize('admin', 'university_staff', 'student'),
  validate(merkleProofSchema),
  asyncHandler(certificateController.verifyMerkleProof)
);

router.get(
  '/merkle/root/:issuerAddress',
  authenticate,
  authorize('admin', 'university_staff'),
  asyncHandler(certificateController.getIssuerMerkleRoot)
);

// ---- Multi-tenant issuer management ----
router.post(
  '/issuer/register',
  authenticate,
  authorize('university_staff', 'admin'),
  validate(registerIssuerSchema),
  asyncHandler(certificateController.registerIssuer)
);

router.get(
  '/issuers',
  authenticate,
  authorize('admin', 'university_staff'),
  asyncHandler(certificateController.getIssuers)
);

router.get(
  '/issuer/:walletAddress',
  authenticate,
  authorize('admin', 'university_staff'),
  asyncHandler(certificateController.getIssuer)
);

router.put(
  '/issuer/status',
  authenticate,
  authorize('admin'),
  asyncHandler(certificateController.updateIssuerStatus)
);

// ---- Circuit breaker (pause/unpause) ----
router.post(
  '/admin/pause',
  authenticate,
  authorize('admin'),
  asyncHandler(certificateController.pauseContract)
);

router.post(
  '/admin/unpause',
  authenticate,
  authorize('admin'),
  asyncHandler(certificateController.unpauseContract)
);

router.get(
  '/admin/status',
  authenticate,
  authorize('admin'),
  asyncHandler(certificateController.getContractStatus)
);

// ---- Privacy-preserving verification ----
router.post(
  '/privacy/commitment',
  authenticate,
  authorize('admin', 'university_staff'),
  validate(privacyCommitmentSchema),
  asyncHandler(certificateController.generateSaltedCommitment)
);

router.post(
  '/privacy/build-tree',
  authenticate,
  authorize('admin', 'university_staff'),
  validate(privacyBuildTreeSchema),
  asyncHandler(certificateController.buildCertificateTree)
);

router.post(
  '/privacy/verify',
  authenticate,
  validate(privacyVerifySchema),
  asyncHandler(certificateController.verifyPrivacyProof)
);

router.post(
  '/privacy/verify-onchain',
  authenticate,
  authorize('admin', 'university_staff', 'student'),
  validate(merkleProofSchema),
  asyncHandler(certificateController.verifyPrivacyProofOnChain)
);

router.post(
  '/privacy/nullifier',
  authenticate,
  authorize('admin', 'university_staff'),
  validate(nullifierSchema),
  asyncHandler(certificateController.consumNullifier)
);

router.post(
  '/privacy/verify-nullifier',
  authenticate,
  authorize('admin', 'university_staff', 'student'),
  asyncHandler(certificateController.verifyWithNullifier)
);

router.post(
  '/privacy/selective-disclose',
  authenticate,
  authorize('student', 'university_staff'),
  asyncHandler(certificateController.generateSelectiveDisclosure)
);

router.post(
  '/privacy/verify-disclosure',
  authenticate,
  asyncHandler(certificateController.verifySelectiveDisclosure)
);

module.exports = router;
