const path = require('path');

const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));
const CERTIFICATES_DIR = path.join(UPLOAD_ROOT, 'certificates');
const QR_CODES_DIR = path.join(UPLOAD_ROOT, 'qrcodes');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png'
];

const MAX_FILE_SIZE_MB = Number(process.env.MAX_CERTIFICATE_FILE_MB) || 5;

module.exports = {
  UPLOAD_ROOT,
  CERTIFICATES_DIR,
  QR_CODES_DIR,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES: MAX_FILE_SIZE_MB * 1024 * 1024
};
