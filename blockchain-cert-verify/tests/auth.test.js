const bcrypt = require('bcryptjs');
const request = require('supertest');

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const loadApp = () => {
  jest.resetModules();

  const mockModels = {
    User: {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn()
    },
    Student: {
      create: jest.fn()
    },
    Institution: {
      create: jest.fn()
    }
  };

  jest.doMock('../src/models', () => mockModels);

  return {
    app: require('../src/app'),
    models: mockModels
  };
};

describe('auth API', () => {
  test('registers a student and creates a student profile', async () => {
    const { app, models } = loadApp();
    const user = {
      user_id: 1,
      name: 'Student User',
      email: 'student@example.com',
      role: 'student'
    };

    models.User.findOne.mockResolvedValue(null);
    models.User.create.mockResolvedValue(user);
    models.Student.create.mockResolvedValue({ student_id: 1 });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student User',
        email: 'student@example.com',
        password: 'password123',
        role: 'student',
        studentNumber: 'STU-001',
        enrollmentDate: '2024-01-15',
        department: 'Computer Science'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(models.User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'student@example.com',
        role: 'student',
        password_hash: expect.any(String)
      })
    );
    expect(models.Student.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 1,
        student_number: 'STU-001'
      })
    );
  });

  test('rejects login with an invalid password', async () => {
    const { app, models } = loadApp();

    models.User.findOne.mockResolvedValue({
      user_id: 2,
      name: 'Registrar',
      email: 'registrar@example.com',
      role: 'university_staff',
      password_hash: bcrypt.hashSync('correct-password', 10)
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'registrar@example.com',
        password: 'wrong-password'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid credentials');
  });
});
