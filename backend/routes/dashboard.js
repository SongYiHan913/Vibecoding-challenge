const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(authenticateToken);

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