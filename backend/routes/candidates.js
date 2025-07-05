const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin, requireCandidate } = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(authenticateToken);

// 지원자 목록 조회 (관리자만)
router.get('/', requireAdmin, (req, res) => {
  const { page = 1, limit = 10, appliedField, status, search } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT u.id, u.email, u.name, u.phone, u.experience, u.applied_field, u.status, u.created_at, u.updated_at,
           ts.id as test_session_id, ts.status as test_status, ts.completed_at
    FROM users u
    LEFT JOIN test_sessions ts ON u.test_session_id = ts.id
    WHERE u.role = 'candidate'
  `;
  
  let countQuery = "SELECT COUNT(*) as total FROM users WHERE role = 'candidate'";
  const params = [];
  const conditions = [];

  // 지원 분야 필터
  if (appliedField) {
    conditions.push('u.applied_field = ?');
    params.push(appliedField);
  }

  // 상태 필터
  if (status) {
    conditions.push('u.status = ?');
    params.push(status);
  }

  // 검색 필터
  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    const whereClause = ' AND ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause.replace(/u\./g, '');
  }

  query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  // 총 개수 조회
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) {
      console.error('지원자 개수 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    // 지원자 목록 조회
    db.all(query, params, (err, candidates) => {
      if (err) {
        console.error('지원자 목록 조회 오류:', err);
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
          candidates: candidates.map(candidate => ({
            id: candidate.id,
            email: candidate.email,
            name: candidate.name,
            phone: candidate.phone,
            experience: candidate.experience,
            appliedField: candidate.applied_field,
            status: candidate.status,
            testSession: candidate.test_session_id ? {
              id: candidate.test_session_id,
              status: candidate.test_status,
              completedAt: candidate.completed_at ? new Date(candidate.completed_at) : null
            } : null,
            createdAt: new Date(candidate.created_at),
            updatedAt: new Date(candidate.updated_at)
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

// 지원자 본인 정보 조회 (지원자 전용)
router.get('/me', requireCandidate, (req, res) => {
  const candidateId = req.user.userId;

  const query = `
    SELECT u.*, ts.id as test_session_id, ts.status as test_status, 
           ts.started_at, ts.completed_at, ts.terminated_at, ts.termination_reason,
           e.total_score, e.technical_score, e.personality_score, e.problem_solving_score
    FROM users u
    LEFT JOIN test_sessions ts ON u.test_session_id = ts.id
    LEFT JOIN evaluations e ON ts.id = e.test_session_id
    WHERE u.id = ? AND u.role = 'candidate'
  `;

  db.get(query, [candidateId], (err, candidate) => {
    if (err) {
      console.error('지원자 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: '지원자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        id: candidate.id,
        email: candidate.email,
        name: candidate.name,
        phone: candidate.phone,
        experience: candidate.experience,
        applied_field: candidate.applied_field,
        status: candidate.status,
        test_session_id: candidate.test_session_id,
        testSession: candidate.test_session_id ? {
          id: candidate.test_session_id,
          status: candidate.test_status,
          startedAt: candidate.started_at ? new Date(candidate.started_at) : null,
          completedAt: candidate.completed_at ? new Date(candidate.completed_at) : null,
          terminatedAt: candidate.terminated_at ? new Date(candidate.terminated_at) : null,
          termination_reason: candidate.termination_reason
        } : null,
        evaluation: candidate.total_score !== null ? {
          totalScore: candidate.total_score,
          technicalScore: candidate.technical_score,
          personalityScore: candidate.personality_score,
          problemSolvingScore: candidate.problem_solving_score
        } : null,
        createdAt: new Date(candidate.created_at),
        updatedAt: new Date(candidate.updated_at)
      }
    });
  });
});

// 특정 지원자 조회 (관리자 전용)
router.get('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT u.*, ts.id as test_session_id, ts.status as test_status, 
           ts.started_at, ts.completed_at, ts.terminated_at, ts.termination_reason,
           e.total_score, e.technical_score, e.personality_score, e.problem_solving_score
    FROM users u
    LEFT JOIN test_sessions ts ON u.test_session_id = ts.id
    LEFT JOIN evaluations e ON ts.id = e.test_session_id
    WHERE u.id = ? AND u.role = 'candidate'
  `;

  db.get(query, [id], (err, candidate) => {
    if (err) {
      console.error('지원자 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: '지원자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        id: candidate.id,
        email: candidate.email,
        name: candidate.name,
        phone: candidate.phone,
        experience: candidate.experience,
        appliedField: candidate.applied_field,
        status: candidate.status,
        testSession: candidate.test_session_id ? {
          id: candidate.test_session_id,
          status: candidate.test_status,
          startedAt: candidate.started_at ? new Date(candidate.started_at) : null,
          completedAt: candidate.completed_at ? new Date(candidate.completed_at) : null,
          terminatedAt: candidate.terminated_at ? new Date(candidate.terminated_at) : null,
          terminationReason: candidate.termination_reason
        } : null,
        evaluation: candidate.total_score !== null ? {
          totalScore: candidate.total_score,
          technicalScore: candidate.technical_score,
          personalityScore: candidate.personality_score,
          problemSolvingScore: candidate.problem_solving_score
        } : null,
        createdAt: new Date(candidate.created_at),
        updatedAt: new Date(candidate.updated_at)
      }
    });
  });
});

// 지원자 상태 변경
router.patch('/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'testing', 'completed', 'evaluated'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 상태입니다.'
    });
  }

  db.run(
    'UPDATE users SET status = ?, updated_at = datetime("now") WHERE id = ? AND role = "candidate"',
    [status, id],
    function(err) {
      if (err) {
        console.error('지원자 상태 변경 오류:', err);
        return res.status(500).json({
          success: false,
          message: '상태 변경 중 오류가 발생했습니다.'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: '지원자를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '지원자 상태가 변경되었습니다.'
      });
    }
  );
});

// 지원자 통계 조회
router.get('/stats/overview', requireAdmin, (req, res) => {
  const queries = {
    total: 'SELECT COUNT(*) as count FROM users WHERE role = "candidate"',
    byStatus: 'SELECT status, COUNT(*) as count FROM users WHERE role = "candidate" GROUP BY status',
    byField: 'SELECT applied_field, COUNT(*) as count FROM users WHERE role = "candidate" GROUP BY applied_field',
    recentRegistrations: `
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE role = "candidate" AND created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `
  };

  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(`통계 조회 오류 (${key}):`, err);
        return res.status(500).json({
          success: false,
          message: '통계 조회 중 오류가 발생했습니다.'
        });
      }

      results[key] = rows;
      completed++;

      if (completed === total) {
        res.json({
          success: true,
          data: {
            totalCandidates: results.total[0]?.count || 0,
            statusDistribution: results.byStatus || [],
            fieldDistribution: results.byField || [],
            recentRegistrations: results.recentRegistrations || []
          }
        });
      }
    });
  });
});

module.exports = router; 