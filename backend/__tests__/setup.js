const { server } = require('../../server');

beforeAll(async () => {
  // 테스트 전에 필요한 설정
});

afterAll(async () => {
  // 서버 종료
  await server.close();
}); 