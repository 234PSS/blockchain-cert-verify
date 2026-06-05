const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');
const {
  CERTIFICATES_DIR,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES
} = require('../config/upload');

if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CERTIFICATES_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF, JPEG, and PNG files are allowed', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES }
});

const uploadCertificateDocument = (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('Certificate document exceeds maximum file size', 400));
      }
      return next(new AppError(err.message, 400));
    }
    if (err) return next(err);
    if (!req.file) {
      return next(new AppError('Certificate document is required', 400));
    }
    next();
  });
};

module.exports = { uploadCertificateDocument };
