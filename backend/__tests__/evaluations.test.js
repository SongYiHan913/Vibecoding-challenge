const request = require('supertest');
const { app } = require('../../server');

describe('Evaluations API Tests', () => {
  let adminToken;
  let evaluationId;
  let testSessionId = 1; // 테스트용 세션 ID

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

  describe('POST /api/evaluations', () => {
    it('should create a new evaluation', async () => {
      const response = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          testSessionId,
          scores: [
            { questionId: 1, score: 8, comment: 'Good understanding' },
            { questionId: 2, score: 7, comment: 'Decent solution' },
            { questionId: 3, score: 9, comment: 'Excellent approach' }
          ],
          overallComment: 'Strong candidate with good technical skills'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      evaluationId = response.body.id;
    });
  });

  describe('GET /api/evaluations', () => {
    it('should get all evaluations', async () => {
      const response = await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get a specific evaluation', async () => {
      const response = await request(app)
        .get(`/api/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', evaluationId);
    });
  });

  describe('PUT /api/evaluations/:id', () => {
    it('should update an evaluation', async () => {
      const response = await request(app)
        .put(`/api/evaluations/${evaluationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scores: [
            { questionId: 1, score: 9, comment: 'Updated: Excellent understanding' },
            { questionId: 2, score: 8, comment: 'Updated: Good solution' },
            { questionId: 3, score: 9, comment: 'Updated: Excellent approach' }
          ],
          overallComment: 'Updated: Outstanding candidate with excellent technical skills'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', evaluationId);
    });
  });
}); 