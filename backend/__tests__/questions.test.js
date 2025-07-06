const request = require('supertest');
const { app } = require('../../server');

describe('Questions API Tests', () => {
  let authToken;
  let questionId;

  beforeAll(async () => {
    // 관리자로 로그인하여 토큰 획득
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'adminpass'
      });
    authToken = loginResponse.body.token;
  });

  describe('POST /api/questions', () => {
    it('should create a new question', async () => {
      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Question',
          content: 'What is your favorite programming language?',
          category: 'personality',
          difficulty: 'easy'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      questionId = response.body.id;
    });
  });

  describe('GET /api/questions', () => {
    it('should get all questions', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get a specific question', async () => {
      const response = await request(app)
        .get(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', questionId);
    });
  });

  describe('PUT /api/questions/:id', () => {
    it('should update a question', async () => {
      const response = await request(app)
        .put(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Question',
          content: 'Updated content',
          category: 'personality',
          difficulty: 'medium'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Test Question');
    });
  });

  describe('DELETE /api/questions/:id', () => {
    it('should delete a question', async () => {
      const response = await request(app)
        .delete(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });
}); 