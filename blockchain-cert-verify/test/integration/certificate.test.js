const request = require('supertest');
const express = require('express');
const { sequelize } = require('../../src/models');
const certificateRoutes = require('../../src/routes/certificateRoutes');

const app = express();
app.use(express.json());
app.use('/api/certificates', certificateRoutes);

describe('Certificate API Integration Tests', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should return 404 for verifying a non-existent certificate UUID', async () => {
    const randomUuid = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/certificates/verify/${randomUuid}`);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Certificate not found');
  });

  it('should return 404 for verifying a non-existent certificate SHA256 hash', async () => {
    const fakeHash = '0x' + 'f'.repeat(64);
    const res = await request(app)
      .get(`/api/certificates/verify/${fakeHash}`);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Certificate not found');
  });
});
