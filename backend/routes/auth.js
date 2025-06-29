const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 로그인
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: '이메일과 비밀번호를 모두 입력해주세요.'
    });
  }

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, user) => {
      if (err) {
        console.error('로그인 쿼리 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // 비밀번호 확인
      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // JWT 토큰 생성
      try {
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
        const jwtExpires = process.env.JWT_EXPIRES_IN || '24h';
        
        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email, 
            role: user.role 
          },
          jwtSecret,
          { expiresIn: jwtExpires }
        );

        // 비밀번호 제외하고 사용자 정보 반환
        const { password: _, ...userWithoutPassword } = user;

        res.json({
          success: true,
          message: '로그인에 성공했습니다.',
          data: {
            user: {
              ...userWithoutPassword,
              createdAt: new Date(userWithoutPassword.created_at),
              updatedAt: new Date(userWithoutPassword.updated_at)
            },
            token
          }
        });
      } catch (tokenError) {
        console.error('JWT 토큰 생성 오류:', tokenError);
        return res.status(500).json({
          success: false,
          message: 'JWT 토큰 생성 중 오류가 발생했습니다.'
        });
      }
    }
  );
});

// 회원가입 (지원자만)
router.post('/register', (req, res) => {
  const { email, password, name, phone, experience, appliedField } = req.body;

  // 입력 유효성 검사
  if (!email || !password || !name || !phone || experience === undefined || !appliedField) {
    return res.status(400).json({
      success: false,
      message: '모든 필드를 입력해주세요.'
    });
  }

  // 이메일 중복 확인
  db.get(
    'SELECT id FROM users WHERE email = ?',
    [email],
    (err, existingUser) => {
      if (err) {
        console.error('이메일 중복 확인 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '이미 등록된 이메일입니다.'
        });
      }

      // 비밀번호 해시화
      const hashedPassword = bcrypt.hashSync(password, 10);
      const userId = uuidv4();

      // 사용자 생성
      db.run(
        `INSERT INTO users (id, email, password, name, role, phone, experience, applied_field, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'candidate', ?, ?, ?, datetime('now'), datetime('now'))`,
        [userId, email, hashedPassword, name, phone, experience, appliedField],
        function(err) {
          if (err) {
            console.error('회원가입 오류:', err);
            return res.status(500).json({
              success: false,
              message: '회원가입 중 오류가 발생했습니다.'
            });
          }

          res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다.'
          });
        }
      );
    }
  );
});

// 현재 사용자 정보 조회
router.get('/me', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, email, name, role, phone, experience, applied_field, status, created_at, updated_at FROM users WHERE id = ?',
    [req.user.userId],
    (err, user) => {
      if (err) {
        console.error('사용자 정보 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: {
          ...user,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at)
        }
      });
    }
  );
});

// 로그아웃 (클라이언트에서 토큰 삭제)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '로그아웃되었습니다.'
  });
});

module.exports = router; 