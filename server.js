const express = require('express');
const next = require('next');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./backend/config/swagger');
require('dotenv').config();

// 환경변수 기본값 설정
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'default-secret-key-for-development-only';
  console.warn('⚠️  JWT_SECRET이 설정되지 않았습니다. 개발용 기본값을 사용합니다.');
}

if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '24h';
}

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

// Next.js app 초기화
const nextApp = next({ 
  dev, 
  dir: './frontend'
});
const handle = nextApp.getRequestHandler();

// Express app 초기화
const app = express();

// 미들웨어 설정
app.use(helmet({
  contentSecurityPolicy: false, // Next.js와 호환성을 위해 비활성화
}));
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "온라인 면접 시스템 API 문서",
}));

// 정적 파일 서빙 (uploads, assets 등)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 라우트들
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/users', require('./backend/routes/users'));
app.use('/api/candidates', require('./backend/routes/candidates'));
app.use('/api/questions', require('./backend/routes/questions'));
app.use('/api/test-sessions', require('./backend/routes/testSessions'));
app.use('/api/evaluations', require('./backend/routes/evaluations'));
app.use('/api/dashboard', require('./backend/routes/dashboard'));
app.use('/api/config', require('./backend/routes/config'));

// 헬스 체크 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('서버 에러:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
    error: dev ? error.message : undefined
  });
});

// 404 핸들러 (API 경로에 대해서만)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 API 엔드포인트를 찾을 수 없습니다.'
  });
});

// Next.js가 준비된 후 서버 시작
nextApp.prepare().then(() => {
  // 모든 다른 요청은 Next.js가 처리
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  app.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 서버가 http://localhost:${port} 에서 실행 중입니다`);
    console.log(`📁 환경: ${dev ? 'development' : 'production'}`);
  });
}).catch((ex) => {
  console.error('서버 시작 중 오류:', ex.stack);
  process.exit(1);
}); 