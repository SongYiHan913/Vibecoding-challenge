const request = require('supertest');
const { app } = require('../../server');

describe('Test Sessions API Tests', () => {
  let authToken;
  let testSessionId;

  beforeAll(async () => {
    // 후보자로 로그인하여 토큰 획득
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'candidate@example.com',
        password: 'candidatepass'
      });
    authToken = loginResponse.body.token;
  });

  describe('POST /api/test-sessions', () => {
    it('should create a new test session', async () => {
      const response = await request(app)
        .post('/api/test-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          candidateId: 1,
          questionIds: [1, 2, 3],
          duration: 60
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      testSessionId = response.body.id;
    });
  });

  describe('GET /api/test-sessions', () => {
    it('should get current test session', async () => {
      const response = await request(app)
        .get('/api/test-sessions/current')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });

    it('should get specific test session', async () => {
      const response = await request(app)
        .get(`/api/test-sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testSessionId);
    });
  });

  describe('PUT /api/test-sessions/:id', () => {
    it('should submit answers for a test session', async () => {
      const response = await request(app)
        .put(`/api/test-sessions/${testSessionId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [
            { questionId: 1, answer: 'Test answer 1' },
            { questionId: 2, answer: 'Test answer 2' },
            { questionId: 3, answer: 'Test answer 3' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'completed');
    });
  });
}); 