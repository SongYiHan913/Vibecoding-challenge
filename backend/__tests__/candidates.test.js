const request = require('supertest');
const { app } = require('../../server');

describe('Candidates API Tests', () => {
  let adminToken;
  let candidateId;

  beforeAll(async () => {
    // 관리자로 로그인하여 토큰 획득
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'adminpass'
      });
    adminToken = loginResponse.body.token;
  });

  describe('POST /api/candidates', () => {
    it('should create a new candidate', async () => {
      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Candidate',
          email: 'candidate@test.com',
          position: 'Software Engineer',
          experience: '5 years',
          skills: ['JavaScript', 'React', 'Node.js']
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      candidateId = response.body.id;
    });
  });

  describe('GET /api/candidates', () => {
    it('should get all candidates', async () => {
      const response = await request(app)
        .get('/api/candidates')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get a specific candidate', async () => {
      const response = await request(app)
        .get(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', candidateId);
    });
  });

  describe('PUT /api/candidates/:id', () => {
    it('should update a candidate', async () => {
      const response = await request(app)
        .put(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Test Candidate',
          position: 'Senior Software Engineer',
          experience: '6 years',
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript']
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Test Candidate');
    });
  });

  describe('DELETE /api/candidates/:id', () => {
    it('should delete a candidate', async () => {
      const response = await request(app)
        .delete(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
}); 