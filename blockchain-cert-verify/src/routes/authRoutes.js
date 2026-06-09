const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const rateLimit = require('../middleware/rateLimitMiddleware');

// 5 requests per 15 minutes for registering and 10 for logging in
router.post('/register', rateLimit(5, 15 * 60 * 1000), authController.register);
router.post('/login', rateLimit(10, 15 * 60 * 1000), authController.login);
router.get('/profile', authenticate, authController.getProfile);

router.get('/institutions', authenticate, authorize('admin'), authController.listInstitutions);
router.put('/institutions/verify/:id', authenticate, authorize('admin'), authController.verifyInstitution);

module.exports = router;
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { registerSchema, loginSchema } = require('../validators/authValidators');

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/profile', authenticate, asyncHandler(authController.getProfile));

module.exports = router;
