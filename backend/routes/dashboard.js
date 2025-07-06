const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: 대시보드 통계 및 요약 정보 API
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: 대시보드 요약 정보 조회
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 대시보드 요약 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_candidates:
 *                       type: integer
 *                       description: 전체 지원자 수
 *                     active_sessions:
 *                       type: integer
 *                       description: 진행 중인 세션 수
 *                     completed_sessions:
 *                       type: integer
 *                       description: 완료된 세션 수
 *                     average_score:
 *                       type: number
 *                       description: 전체 평균 점수
 */

/**
 * @swagger
 * /api/dashboard/statistics:
 *   get:
 *     summary: 상세 통계 정보 조회
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 통계 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     daily_sessions:
 *                       type: array
 *                       description: 일별 세션 통계
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 *                     category_stats:
 *                       type: object
 *                       description: 카테고리별 통계
 *                     difficulty_stats:
 *                       type: object
 *                       description: 난이도별 통계
 */

/**
 * @swagger
 * /api/dashboard/recent-activities:
 *   get:
 *     summary: 최근 활동 내역 조회
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 조회할 활동 수
 *     responses:
 *       200:
 *         description: 최근 활동 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       type:
 *                         type: string
 *                         enum: [session_start, session_complete, evaluation_added]
 *                       description:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 */

// 모든 라우트에 인증 필요
router.use(authenticateToken);

// 간단한 통계 정보 제공 (관리자만)
router.get('/stats', requireAdmin, (req, res) => {
  const queries = [
    // 총 지원자 수
    'SELECT COUNT(*) as totalCandidates FROM users WHERE role = "candidate"',
    // 총 질문 수  
    'SELECT COUNT(*) as totalQuestions FROM questions',
    // 완료된 테스트 수
    'SELECT COUNT(*) as completedTests FROM test_sessions WHERE status = "completed"',
    // 대기 중인 평가 수 (완료된 테스트 중 평가되지 않은 것)
    `SELECT COUNT(*) as pendingEvaluations 
     FROM test_sessions ts 
     LEFT JOIN evaluations e ON ts.id = e.test_session_id 
     WHERE ts.status = "completed" AND (e.id IS NULL OR e.status != "completed")`
  ];

  const results = {};
  let completed = 0;

  queries.forEach((query, index) => {
    db.get(query, [], (err, row) => {
      if (err) {
        console.error('통계 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '통계 조회 중 오류가 발생했습니다.'
        });
      }

      const keys = ['totalCandidates', 'totalQuestions', 'completedTests', 'pendingEvaluations'];
      results[keys[index]] = Object.values(row)[0] || 0;
      completed++;

      if (completed === queries.length) {
        res.json({
          success: true,
          data: results
        });
      }
    });
  });
});

// 관리자 대시보드 전체 통계 (관리자만)
router.get('/admin/overview', requireAdmin, (req, res) => {
  const queries = {
    // 총 지원자 수
    totalCandidates: 'SELECT COUNT(*) as count FROM users WHERE role = "candidate"',
    
    // 상태별 지원자 수
    candidatesByStatus: 'SELECT status, COUNT(*) as count FROM users WHERE role = "candidate" GROUP BY status',
    
    // 분야별 지원자 수
    candidatesByField: 'SELECT applied_field, COUNT(*) as count FROM users WHERE role = "candidate" GROUP BY applied_field',
    
    // 진행 중인 테스트 수
    activeTests: 'SELECT COUNT(*) as count FROM test_sessions WHERE status = "in-progress"',
    
    // 완료된 테스트 수
    completedTests: 'SELECT COUNT(*) as count FROM test_sessions WHERE status = "completed"',
    
    // 평가 완료된 지원자 수
    evaluatedCandidates: 'SELECT COUNT(*) as count FROM evaluations WHERE status = "completed"',
    
    // 최근 7일간 등록 추이
    recentRegistrations: `
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE role = "candidate" AND created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
    
    // 평균 점수
    averageScores: `
      SELECT 
        AVG(technical_score) as avgTechnical,
        AVG(personality_score) as avgPersonality,
        AVG(problem_solving_score) as avgProblemSolving,
        AVG(total_score) as avgTotal
      FROM evaluations 
      WHERE status = "completed"
    `,
    
    // 점수 분포
    scoreDistribution: `
      SELECT 
        CASE 
          WHEN total_score >= 90 THEN '90-100'
          WHEN total_score >= 80 THEN '80-89'
          WHEN total_score >= 70 THEN '70-79'
          WHEN total_score >= 60 THEN '60-69'
          ELSE '0-59'
        END as score_range,
        COUNT(*) as count
      FROM evaluations 
      WHERE status = "completed"
      GROUP BY score_range
      ORDER BY score_range DESC
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

      if (key === 'averageScores') {
        results[key] = rows[0] || { avgTechnical: 0, avgPersonality: 0, avgProblemSolving: 0, avgTotal: 0 };
      } else {
        results[key] = rows;
      }
      
      completed++;

      if (completed === total) {
        res.json({
          success: true,
          data: {
            summary: {
              totalCandidates: results.totalCandidates[0]?.count || 0,
              activeTests: results.activeTests[0]?.count || 0,
              completedTests: results.completedTests[0]?.count || 0,
              evaluatedCandidates: results.evaluatedCandidates[0]?.count || 0
            },
            distribution: {
              candidatesByStatus: results.candidatesByStatus || [],
              candidatesByField: results.candidatesByField || [],
              scoreDistribution: results.scoreDistribution || []
            },
            trends: {
              recentRegistrations: results.recentRegistrations || []
            },
            averageScores: {
              technical: Math.round((results.averageScores.avgTechnical || 0) * 100) / 100,
              personality: Math.round((results.averageScores.avgPersonality || 0) * 100) / 100,
              problemSolving: Math.round((results.averageScores.avgProblemSolving || 0) * 100) / 100,
              total: Math.round((results.averageScores.avgTotal || 0) * 100) / 100
            }
          }
        });
      }
    });
  });
});

// 최근 활동 조회 (간소화된 엔드포인트)
router.get('/activities', requireAdmin, (req, res) => {
  const { limit = 20 } = req.query;

  const query = `
    SELECT 
      'registration' as type,
      u.id as entity_id,
      u.name as entity_name,
      u.email as details,
      u.created_at as timestamp
    FROM users u
    WHERE u.role = 'candidate'
    
    UNION ALL
    
    SELECT 
      'test_completed' as type,
      ts.candidate_id as entity_id,
      u.name as entity_name,
      'Test completed' as details,
      ts.completed_at as timestamp
    FROM test_sessions ts
    JOIN users u ON ts.candidate_id = u.id
    WHERE ts.status = 'completed' AND ts.completed_at IS NOT NULL
    
    UNION ALL
    
    SELECT 
      'evaluation_completed' as type,
      e.candidate_id as entity_id,
      u.name as entity_name,
      CAST(e.total_score as TEXT) || '점' as details,
      e.evaluated_at as timestamp
    FROM evaluations e
    JOIN users u ON e.candidate_id = u.id
    WHERE e.status = 'completed'
    
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  db.all(query, [parseInt(limit)], (err, activities) => {
    if (err) {
      console.error('최근 활동 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      data: activities.map(activity => ({
        type: activity.type,
        entityId: activity.entity_id,
        entityName: activity.entity_name,
        details: activity.details,
        timestamp: new Date(activity.timestamp)
      }))
    });
  });
});

// 최근 활동 조회 (관리자만)
router.get('/admin/recent-activities', requireAdmin, (req, res) => {
  const { limit = 20 } = req.query;

  const query = `
    SELECT 
      'registration' as type,
      u.id as entity_id,
      u.name as entity_name,
      u.email as details,
      u.created_at as timestamp
    FROM users u
    WHERE u.role = 'candidate'
    
    UNION ALL
    
    SELECT 
      'test_completed' as type,
      ts.candidate_id as entity_id,
      u.name as entity_name,
      'Test completed' as details,
      ts.completed_at as timestamp
    FROM test_sessions ts
    JOIN users u ON ts.candidate_id = u.id
    WHERE ts.status = 'completed' AND ts.completed_at IS NOT NULL
    
    UNION ALL
    
    SELECT 
      'evaluation_completed' as type,
      e.candidate_id as entity_id,
      u.name as entity_name,
      CAST(e.total_score as TEXT) || '점' as details,
      e.evaluated_at as timestamp
    FROM evaluations e
    JOIN users u ON e.candidate_id = u.id
    WHERE e.status = 'completed'
    
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  db.all(query, [parseInt(limit)], (err, activities) => {
    if (err) {
      console.error('최근 활동 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      data: activities.map(activity => ({
        type: activity.type,
        entityId: activity.entity_id,
        entityName: activity.entity_name,
        details: activity.details,
        timestamp: new Date(activity.timestamp)
      }))
    });
  });
});

// 지원자 대시보드 (지원자만)
router.get('/candidate/overview', (req, res) => {
  const candidateId = req.user.userId;

  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      success: false,
      message: '지원자만 접근 가능합니다.'
    });
  }

  // 지원자 정보와 테스트/평가 상태 조회
  const query = `
    SELECT 
      u.*,
      ts.id as test_session_id,
      ts.status as test_status,
      ts.started_at,
      ts.completed_at,
      ts.terminated_at,
      ts.termination_reason,
      e.total_score,
      e.technical_score,
      e.personality_score,
      e.problem_solving_score,
      e.evaluated_at
    FROM users u
    LEFT JOIN test_sessions ts ON u.test_session_id = ts.id
    LEFT JOIN evaluations e ON ts.id = e.test_session_id
    WHERE u.id = ? AND u.role = 'candidate'
  `;

  db.get(query, [candidateId], (err, candidate) => {
    if (err) {
      console.error('지원자 대시보드 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: '지원자 정보를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          experience: candidate.experience,
          appliedField: candidate.applied_field,
          status: candidate.status,
          createdAt: new Date(candidate.created_at)
        },
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
          problemSolvingScore: candidate.problem_solving_score,
          evaluatedAt: new Date(candidate.evaluated_at)
        } : null
      }
    });
  });
});

// 시스템 통계 (관리자만)
router.get('/admin/system-stats', requireAdmin, (req, res) => {
  const queries = {
    // 데이터베이스 크기 정보
    tableStats: `
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 
        'questions' as table_name, COUNT(*) as count FROM questions
      UNION ALL
      SELECT 
        'test_sessions' as table_name, COUNT(*) as count FROM test_sessions
      UNION ALL
      SELECT 
        'evaluations' as table_name, COUNT(*) as count FROM evaluations
    `,
    
    // 성능 통계
    performanceStats: `
      SELECT 
        AVG(
          CASE 
            WHEN ts.started_at IS NOT NULL AND ts.completed_at IS NOT NULL 
            THEN (julianday(ts.completed_at) - julianday(ts.started_at)) * 24 * 60
            ELSE NULL 
          END
        ) as avg_test_duration_minutes
      FROM test_sessions ts
      WHERE ts.status = 'completed'
    `,
    
    // 부정행위 통계
    cheatingStats: `
      SELECT 
        COUNT(*) as total_sessions,
        AVG(cheating_attempts) as avg_cheating_attempts,
        AVG(focus_lost_count) as avg_focus_lost,
        COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated_count
      FROM test_sessions
    `
  };

  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(`시스템 통계 조회 오류 (${key}):`, err);
        return res.status(500).json({
          success: false,
          message: '시스템 통계 조회 중 오류가 발생했습니다.'
        });
      }

      results[key] = rows;
      completed++;

      if (completed === total) {
        res.json({
          success: true,
          data: {
            tables: results.tableStats || [],
            performance: {
              avgTestDuration: Math.round(results.performanceStats[0]?.avg_test_duration_minutes || 0)
            },
            cheating: {
              totalSessions: results.cheatingStats[0]?.total_sessions || 0,
              avgCheatingAttempts: Math.round((results.cheatingStats[0]?.avg_cheating_attempts || 0) * 100) / 100,
              avgFocusLost: Math.round((results.cheatingStats[0]?.avg_focus_lost || 0) * 100) / 100,
              terminatedCount: results.cheatingStats[0]?.terminated_count || 0
            }
          }
        });
      }
    });
  });
});

module.exports = router; 