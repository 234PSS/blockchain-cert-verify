const request = require('supertest');
const express = require('express');
const { sequelize, User } = require('../../src/models');
const authRoutes = require('../../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure the database connection works
    await sequelize.authenticate();
  });

  afterAll(async () => {
    // Clean up connections
    await sequelize.close();
  });

  it('should prevent registration with role admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Evil Admin',
        email: 'eviladmin@system.com',
        password: 'password123',
        role: 'admin'
      });
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Admin registration is restricted');
  });

  it('should allow student registration and return a JWT token', async () => {
    // Clean up test user if it already exists from a previous run
    await User.destroy({ where: { email: 'student_test@university.edu' } });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'student_test@university.edu',
        password: 'password123',
        role: 'student'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');

    // Clean up test user
    await User.destroy({ where: { email: 'student_test@university.edu' } });
  });
});
