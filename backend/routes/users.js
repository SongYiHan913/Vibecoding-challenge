const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(authenticateToken);

// 모든 사용자 조회 (관리자만)
router.get('/', requireAdmin, (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT id, email, name, role, phone, experience, applied_field, status, created_at, updated_at FROM users';
  let countQuery = 'SELECT COUNT(*) as total FROM users';
  const params = [];
  const conditions = [];

  // 역할 필터
  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  // 검색 필터
  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  // 총 개수 조회
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) {
      console.error('사용자 개수 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    // 사용자 목록 조회
    db.all(query, params, (err, users) => {
      if (err) {
        console.error('사용자 목록 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          users: users.map(user => ({
            ...user,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at)
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages
          }
        }
      });
    });
  });
});

// 특정 사용자 조회
router.get('/:id', (req, res) => {
  const { id } = req.params;

  // 관리자는 모든 사용자 조회 가능, 일반 사용자는 본인만
  if (req.user.role !== 'admin' && req.user.userId !== id) {
    return res.status(403).json({
      success: false,
      message: '권한이 없습니다.'
    });
  }

  db.get(
    'SELECT id, email, name, role, phone, experience, applied_field, status, created_at, updated_at FROM users WHERE id = ?',
    [id],
    (err, user) => {
      if (err) {
        console.error('사용자 조회 오류:', err);
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

// 사용자 정보 수정
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, status } = req.body;

  // 관리자는 모든 사용자 수정 가능, 일반 사용자는 본인만 (단, status는 수정 불가)
  if (req.user.role !== 'admin' && req.user.userId !== id) {
    return res.status(403).json({
      success: false,
      message: '권한이 없습니다.'
    });
  }

  const updates = [];
  const params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }

  if (phone) {
    updates.push('phone = ?');
    params.push(phone);
  }

  // status는 관리자만 수정 가능
  if (status && req.user.role === 'admin') {
    updates.push('status = ?');
    params.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: '수정할 데이터가 없습니다.'
    });
  }

  updates.push('updated_at = datetime("now")');
  params.push(id);

  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  db.run(query, params, function(err) {
    if (err) {
      console.error('사용자 수정 오류:', err);
      return res.status(500).json({
        success: false,
        message: '사용자 정보 수정 중 오류가 발생했습니다.'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '사용자 정보가 수정되었습니다.'
    });
  });
});

// 사용자 삭제 (관리자만)
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  // 본인 계정 삭제 방지
  if (req.user.userId === id) {
    return res.status(400).json({
      success: false,
      message: '본인 계정은 삭제할 수 없습니다.'
    });
  }

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('사용자 삭제 오류:', err);
      return res.status(500).json({
        success: false,
        message: '사용자 삭제 중 오류가 발생했습니다.'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '사용자가 삭제되었습니다.'
    });
  });
});

module.exports = router; 