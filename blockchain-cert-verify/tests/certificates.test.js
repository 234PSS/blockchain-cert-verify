const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
const TEST_UPLOAD_DIR = path.join(os.tmpdir(), 'blockchain-cert-verify-tests');

const makeToken = (role, id = 1) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const makeModel = (data) => ({
  ...data,
  update: jest.fn(async function update(changes) {
    Object.assign(this, changes);
    return this;
  }),
  reload: jest.fn(async function reload() {
    return this;
  }),
  destroy: jest.fn(async function destroy() {
    return undefined;
  }),
  toJSON: jest.fn(function toJSON() {
    const { update, reload, destroy, toJSON, ...plain } = this;
    return plain;
  })
});

const loadApp = () => {
  jest.resetModules();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.UPLOAD_DIR = TEST_UPLOAD_DIR;

  const mockModels = {
    User: {
      findByPk: jest.fn()
    },
    Student: {
      findByPk: jest.fn(),
      findOne: jest.fn()
    },
    Course: {
      findByPk: jest.fn()
    },
    Institution: {
      findByPk: jest.fn()
    },
    Certificate: {
      create: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn()
    },
    VerificationLog: {
      create: jest.fn()
    }
  };

  const mockBlockchainService = {
    isReady: jest.fn(() => true),
    getUnavailableReason: jest.fn(() => null),
    getStatus: jest.fn(() => ({ ready: true, reason: null })),
    issueCertificate: jest.fn(),
    verifyCertificate: jest.fn(),
    revokeCertificate: jest.fn()
  };

  const mockFileService = {
    hashFile: jest.fn(() => 'document-hash'),
    hashCertificateRecord: jest.fn(() => 'certificate-hash'),
    toRelativePath: jest.fn(() => 'certificates/test.pdf'),
    generateQrCode: jest.fn(() => Promise.resolve('qr/cert-1.png')),
    removeStoredFile: jest.fn(),
    cleanupUploadedFile: jest.fn(),
    formatCertificate: jest.fn((certificate) => {
      const data = certificate.toJSON ? certificate.toJSON() : certificate;
      return {
        ...data,
        filePath: data.document_path ? `/uploads/${data.document_path}` : null,
        qrPath: data.qr_code_path ? `/uploads/${data.qr_code_path}` : null,
        verificationUrl: `http://localhost:3000/verify/${data.certificate_id}`
      };
    })
  };

  jest.doMock('../src/models', () => mockModels);
  jest.doMock('../src/services/blockchainService', () => mockBlockchainService);
  jest.doMock('../src/services/certificateFileService', () => mockFileService);

  return {
    app: require('../src/app'),
    models: mockModels,
    blockchainService: mockBlockchainService,
    fileService: mockFileService
  };
};

describe('certificate API', () => {
  afterEach(() => {
    fs.rmSync(TEST_UPLOAD_DIR, { recursive: true, force: true });
  });

  test('blocks students from viewing another student by id', async () => {
    const { app, models } = loadApp();
    models.User.findByPk.mockResolvedValue({
      user_id: 1,
      email: 'student@example.com',
      role: 'student',
      name: 'Student User'
    });

    const res = await request(app)
      .get('/api/certificates/student/99')
      .set('Authorization', `Bearer ${makeToken('student')}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Access denied');
    expect(models.Student.findByPk).not.toHaveBeenCalled();
  });

  test('returns only the logged-in student certificates from /me', async () => {
    const { app, models } = loadApp();
    models.User.findByPk.mockResolvedValue({
      user_id: 7,
      email: 'student@example.com',
      role: 'student',
      name: 'Student User'
    });
    const certificate = makeModel({
      certificate_id: 10,
      student_id: 5,
      certificate_hash: 'certificate-hash',
      is_revoked: false
    });

    models.Student.findOne.mockResolvedValue({ student_id: 5 });
    models.Certificate.findAll.mockResolvedValue([certificate]);

    const res = await request(app)
      .get('/api/certificates/me')
      .set('Authorization', `Bearer ${makeToken('student', 7)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.certificates).toHaveLength(1);
    expect(models.Student.findOne).toHaveBeenCalledWith({ where: { user_id: 7 } });
    expect(models.Certificate.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { student_id: 5 } })
    );
  });

  test('issues a certificate with document hash, blockchain id, and QR path', async () => {
    const { app, models, blockchainService, fileService } = loadApp();
    models.User.findByPk.mockResolvedValue({
      user_id: 1,
      email: 'admin@example.com',
      role: 'admin',
      name: 'Admin User'
    });
    const certificate = makeModel({
      certificate_id: 1,
      student_id: 1,
      course_id: 1,
      institution_id: 1,
      certificate_hash: 'certificate-hash',
      document_path: 'certificates/test.pdf',
      qr_code_path: null,
      is_revoked: false
    });

    models.Student.findByPk.mockResolvedValue({
      student_id: 1,
      student_number: 'STU-001',
      graduation_date: '2025-05-30',
      User: { name: 'Student User' }
    });
    models.Course.findByPk.mockResolvedValue({
      course_id: 1,
      course_code: 'CSE401',
      course_name: 'Blockchain Systems',
      institution_id: 1
    });
    models.Institution.findByPk.mockResolvedValue({
      institution_id: 1,
      name: 'State University',
      is_verified: true
    });
    models.Certificate.create.mockResolvedValue(certificate);
    blockchainService.issueCertificate.mockResolvedValue({
      certificateId: '0x1234',
      hash: '0xtx'
    });

    const res = await request(app)
      .post('/api/certificates/issue')
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .field('studentId', '1')
      .field('courseId', '1')
      .field('institutionId', '1')
      .field('grade', 'A')
      .attach('document', Buffer.from('%PDF-1.4 test'), {
        filename: 'certificate.pdf',
        contentType: 'application/pdf'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(blockchainService.issueCertificate).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: 'STU-001',
        courseId: 'CSE401',
        certificateHash: 'certificate-hash'
      })
    );
    expect(fileService.generateQrCode).toHaveBeenCalledWith(1);
    expect(certificate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        blockchain_tx_hash: '0xtx',
        blockchain_certificate_id: '0x1234',
        qr_code_path: 'qr/cert-1.png'
      })
    );
  });

  test('verifies a valid on-chain certificate and records the verification', async () => {
    const { app, models, blockchainService } = loadApp();
    const certificate = makeModel({
      certificate_id: 3,
      certificate_hash: 'certificate-hash',
      blockchain_certificate_id: '0x1234',
      is_revoked: false,
      Institution: { name: 'State University' }
    });

    models.Certificate.findByPk.mockResolvedValue(certificate);
    blockchainService.verifyCertificate.mockResolvedValue({
      valid: true,
      certificateHash: 'certificate-hash',
      institution: 'State University'
    });
    models.VerificationLog.create.mockResolvedValue({});

    const res = await request(app).get('/api/certificates/verify/3');

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.status).toBe('valid');
    expect(models.VerificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        certificate_id: 3,
        verification_status: 'valid',
        blockchain_verification: true
      })
    );
  });

  test('revokes a certificate for admin users', async () => {
    const { app, models, blockchainService } = loadApp();
    models.User.findByPk.mockResolvedValue({
      user_id: 1,
      email: 'admin@example.com',
      role: 'admin',
      name: 'Admin User'
    });
    const certificate = makeModel({
      certificate_id: 4,
      blockchain_certificate_id: '0x1234',
      is_revoked: false
    });

    models.Certificate.findByPk.mockResolvedValue(certificate);
    blockchainService.revokeCertificate.mockResolvedValue({ hash: '0xrevoke' });

    const res = await request(app)
      .put('/api/certificates/revoke/4')
      .set('Authorization', `Bearer ${makeToken('admin')}`)
      .send({ reason: 'Incorrect grade' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(blockchainService.revokeCertificate).toHaveBeenCalledWith('0x1234');
    expect(certificate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_revoked: true,
        revoked_reason: 'Incorrect grade'
      })
    );
  });
});
