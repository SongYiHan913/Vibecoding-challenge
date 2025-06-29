const jwt = require('jsonwebtoken');

// JWT 토큰 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '접근 토큰이 필요합니다.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    req.user = user;
    next();
  });
};

// 관리자 권한 확인 미들웨어
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.'
    });
  }
  next();
};

// 지원자 권한 확인 미들웨어
const requireCandidate = (req, res, next) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      success: false,
      message: '지원자 권한이 필요합니다.'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCandidate
}; 