const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const {
  UPLOAD_ROOT,
  QR_CODES_DIR
} = require('../config/upload');

const ensureQrDir = () => {
  if (!fs.existsSync(QR_CODES_DIR)) {
    fs.mkdirSync(QR_CODES_DIR, { recursive: true });
  }
};

const getPublicBaseUrl = () =>
  (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

const buildVerificationUrl = (certificateId) =>
  `${getPublicBaseUrl()}/verify/${certificateId}`;

const getPublicPath = (relativePath) =>
  relativePath ? `/uploads/${relativePath.replace(/\\/g, '/')}` : null;

const hashFile = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const hashCertificateRecord = (metadata, documentHash) =>
  crypto.createHash('sha256')
    .update(JSON.stringify({ ...metadata, documentHash }))
    .digest('hex');

const toRelativePath = (absolutePath) =>
  path.relative(UPLOAD_ROOT, absolutePath).replace(/\\/g, '/');

const generateQrCode = async (certificateId) => {
  ensureQrDir();
  const filename = `cert-${certificateId}.png`;
  const absolutePath = path.join(QR_CODES_DIR, filename);
  const verificationUrl = buildVerificationUrl(certificateId);

  await QRCode.toFile(absolutePath, verificationUrl, {
    type: 'png',
    width: 300,
    margin: 1,
    errorCorrectionLevel: 'M'
  });

  return toRelativePath(absolutePath);
};

const removeStoredFile = (relativePath) => {
  if (!relativePath) return;
  const absolutePath = path.join(UPLOAD_ROOT, relativePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

const cleanupUploadedFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

const formatCertificate = (certificate) => {
  const data = certificate.toJSON ? certificate.toJSON() : { ...certificate };

  return {
    ...data,
    filePath: getPublicPath(data.document_path),
    qrPath: getPublicPath(data.qr_code_path),
    verificationUrl: buildVerificationUrl(data.certificate_id)
  };
};

module.exports = {
  buildVerificationUrl,
  getPublicPath,
  hashFile,
  hashCertificateRecord,
  toRelativePath,
  generateQrCode,
  removeStoredFile,
  cleanupUploadedFile,
  formatCertificate
};
