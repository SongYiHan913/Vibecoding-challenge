const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken, requireAdmin, requireCandidate } = require('../middleware/auth');
const { performTestCompletionEvaluation } = require('../utils/evaluation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TestSessions
 *   description: 면접 세션 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TestSession:
 *       type: object
 *       required:
 *         - candidate_id
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *           description: 세션 ID
 *         candidate_id:
 *           type: integer
 *           description: 지원자 ID
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *           description: 세션 상태
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: 시작 시간
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: 종료 시간
 *         total_questions:
 *           type: integer
 *           description: 총 질문 수
 *         completed_questions:
 *           type: integer
 *           description: 완료된 질문 수
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 생성 일시
 */

/**
 * @swagger
 * /api/test-sessions:
 *   get:
 *     summary: 모든 면접 세션 목록 조회
 *     tags: [TestSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 세션 상태 필터
 *     responses:
 *       200:
 *         description: 세션 목록 조회 성공
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
 *                     $ref: '#/components/schemas/TestSession'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     current_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *
 *   post:
 *     summary: 새 면접 세션 생성
 *     tags: [TestSessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - candidate_id
 *             properties:
 *               candidate_id:
 *                 type: integer
 *               question_categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [technical, personality, problem_solving]
 *     responses:
 *       201:
 *         description: 세션 생성 성공
 *       400:
 *         description: 잘못된 요청
 */

/**
 * @swagger
 * /api/test-sessions/{id}:
 *   get:
 *     summary: 특정 면접 세션 조회
 *     tags: [TestSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 세션 ID
 *     responses:
 *       200:
 *         description: 세션 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestSession'
 *       404:
 *         description: 세션을 찾을 수 없음
 *
 *   put:
 *     summary: 면접 세션 상태 수정
 *     tags: [TestSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 세션 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: 세션 수정 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 세션을 찾을 수 없음
 */

/**
 * @swagger
 * /api/test-sessions/{id}/questions:
 *   get:
 *     summary: 면접 세션의 질문 목록 조회
 *     tags: [TestSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 세션 ID
 *     responses:
 *       200:
 *         description: 질문 목록 조회 성공
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
 *                     $ref: '#/components/schemas/Question'
 *       404:
 *         description: 세션을 찾을 수 없음
 */

// 모든 라우트에 인증 필요
router.use(authenticateToken);

// 테스트 세션 생성 (관리자만)
router.post('/', requireAdmin, (req, res) => {
  const { candidateId, totalTime, questions } = req.body;

  if (!candidateId || !totalTime || !questions || !Array.isArray(questions)) {
    return res.status(400).json({
      success: false,
      message: '필수 정보가 누락되었습니다.'
    });
  }

  const sessionId = uuidv4();

  // 지원자 확인
  db.get('SELECT id FROM users WHERE id = ? AND role = "candidate"', [candidateId], (err, candidate) => {
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

    // 테스트 세션 생성
    db.run(
      `INSERT INTO test_sessions (
        id, candidate_id, status, questions, remaining_time, total_time, created_at, updated_at
      ) VALUES (?, ?, 'not-started', ?, ?, ?, datetime('now'), datetime('now'))`,
      [sessionId, candidateId, JSON.stringify(questions), totalTime, totalTime],
      function(err) {
        if (err) {
          console.error('테스트 세션 생성 오류:', err);
          return res.status(500).json({
            success: false,
            message: '테스트 세션 생성 중 오류가 발생했습니다.'
          });
        }

        // 지원자의 test_session_id 업데이트
        db.run(
          'UPDATE users SET test_session_id = ?, status = "testing", updated_at = datetime("now") WHERE id = ?',
          [sessionId, candidateId],
          (err) => {
            if (err) {
              console.error('지원자 정보 업데이트 오류:', err);
              return res.status(500).json({
                success: false,
                message: '지원자 정보 업데이트 중 오류가 발생했습니다.'
              });
            }

            res.status(201).json({
              success: true,
              message: '테스트 세션이 생성되었습니다.',
              data: {
                sessionId,
                candidateId,
                status: 'not-started',
                totalTime,
                questionCount: questions.length
              }
            });
          }
        );
      }
    );
  });
});

// 테스트 세션 생성 및 시작 (지원자용 - 질문 자동 생성)
router.post('/start-for-candidate', requireCandidate, async (req, res) => {
  const candidateId = req.user.userId;

  try {
    // 지원자 정보 조회
    const candidate = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ? AND role = "candidate"',
        [candidateId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: '지원자 정보를 찾을 수 없습니다.'
      });
    }

    // 지원자 상태 확인 - 'pending' 상태만 테스트 시작 가능
    if (candidate.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '현재 상태에서는 테스트를 시작할 수 없습니다.',
        data: {
          currentStatus: candidate.status,
          allowedStatus: 'pending'
        }
      });
    }

    // 이미 진행 중인 테스트가 있는지 확인
    const existingSession = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM test_sessions WHERE candidate_id = ? AND status IN ("not-started", "in-progress")',
        [candidateId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: '이미 진행 중인 테스트가 있습니다.',
        data: {
          sessionId: existingSession.id,
          status: existingSession.status
        }
      });
    }

    // 경력에 따른 레벨 결정
    const experienceLevel = candidate.experience <= 5 ? 'junior' : 'senior';

    // 질문 자동 생성
    const questions = await generateQuestionsForCandidate(
      candidate.applied_field,
      experienceLevel
    );

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: '출제 가능한 질문이 부족합니다. 관리자에게 문의하세요.'
      });
    }

    // 테스트 세션 생성
    const sessionId = uuidv4();
    const totalTime = 90 * 60; // 90분 (초)

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO test_sessions (
          id, candidate_id, status, questions, remaining_time, total_time,
          started_at, created_at, updated_at
        ) VALUES (?, ?, 'in-progress', ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
        [sessionId, candidateId, JSON.stringify(questions), totalTime, totalTime],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 지원자 상태를 testing으로 변경
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET status = "testing", test_session_id = ?, updated_at = datetime("now") WHERE id = ?',
        [sessionId, candidateId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      success: true,
      message: '테스트가 시작되었습니다.',
      data: {
        sessionId,
        status: 'in-progress',
        questions: questions.map(q => ({
          ...q,
          // 정답 정보는 클라이언트에 전송하지 않음
          correctAnswer: undefined,
          correctAnswerText: undefined
        })),
        remainingTime: totalTime,
        totalTime: totalTime,
        questionCount: questions.length
      }
    });

  } catch (error) {
    console.error('테스트 시작 오류:', error);
    res.status(500).json({
      success: false,
      message: '테스트 시작 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 질문 자동 생성 함수
async function generateQuestionsForCandidate(appliedField, experienceLevel) {
  // 질문 구성: 총 25문제
  const questionConfig = {
    technical: {
      total: 10,
      'multiple-choice': 6,
      essay: 4
    },
    personality: {
      total: 5,
      essay: 5
    },
    'problem-solving': {
      total: 10,
      essay: 10
    }
  };

  // 난이도 비율: 쉬움 30%, 보통 50%, 어려움 20%
  const difficultyDistribution = {
    easy: 0.3,
    medium: 0.5,
    hard: 0.2
  };

  const selectedQuestions = [];

  try {
    // 1. 기술 질문 선택 (4지선다 6개 + 서술형 4개)
    const techMCQuestions = await selectQuestionsByDifficulty(
      'technical', 'multiple-choice', appliedField, experienceLevel, 
      questionConfig.technical['multiple-choice'], difficultyDistribution
    );
    selectedQuestions.push(...techMCQuestions);

    const techEssayQuestions = await selectQuestionsByDifficulty(
      'technical', 'essay', appliedField, experienceLevel,
      questionConfig.technical.essay, difficultyDistribution
    );
    selectedQuestions.push(...techEssayQuestions);

    // 2. 인성 질문 선택 (서술형 5개)
    const personalityQuestions = await selectQuestionsByDifficulty(
      'personality', 'essay', null, experienceLevel,
      questionConfig.personality.total, difficultyDistribution
    );
    selectedQuestions.push(...personalityQuestions);

    // 3. 문제해결 질문 선택 (서술형 10개)
    const problemSolvingQuestions = await selectQuestionsByDifficulty(
      'problem-solving', 'essay', null, experienceLevel,
      questionConfig['problem-solving'].total, difficultyDistribution
    );
    selectedQuestions.push(...problemSolvingQuestions);

    // 질문에 순서 번호 추가 (중복 필드 제거)
    return selectedQuestions.map((question, index) => ({
      questionOrder: index + 1,
      id: question.id,
      type: question.type,
      format: question.format,
      difficulty: question.difficulty,
      experienceLevel: question.experience_level,
      field: question.field,
      category: question.category,
      question: question.question,
      options: question.options ? JSON.parse(question.options) : null,
      correct_answer: question.correct_answer,
      correct_answer_text: question.correct_answer_text,
      required_keywords: question.required_keywords ? JSON.parse(question.required_keywords) : [],
      points: question.points
    }));

  } catch (error) {
    console.error('질문 생성 오류:', error);
    throw error;
  }
}

// 난이도별 질문 선택 헬퍼 함수
function selectQuestionsByDifficulty(type, format, field, experienceLevel, totalCount, difficultyDist) {
  return new Promise((resolve, reject) => {
    // 난이도별 개수 계산
    const easyCount = Math.round(totalCount * difficultyDist.easy);
    const mediumCount = Math.round(totalCount * difficultyDist.medium);
    const hardCount = totalCount - easyCount - mediumCount;

    const difficulties = [
      { level: 'easy', count: easyCount },
      { level: 'medium', count: mediumCount },
      { level: 'hard', count: hardCount }
    ];

    const selectedQuestions = [];
    let completedDifficulties = 0;

    difficulties.forEach(({ level, count }) => {
      if (count === 0) {
        completedDifficulties++;
        if (completedDifficulties === difficulties.length) {
          resolve(selectedQuestions);
        }
        return;
      }

      let query = 'SELECT * FROM questions WHERE type = ? AND format = ? AND difficulty = ? AND experience_level = ?';
      const params = [type, format, level, experienceLevel];

      if (type === 'technical' && field) {
        query += ' AND (field = ? OR field = "common")';
        params.push(field);
      } else if (type !== 'technical') {
        query += ' AND (field = "common" OR field IS NULL)';
      }

      query += ' ORDER BY RANDOM() LIMIT ?';
      params.push(count);

      db.all(query, params, (err, questions) => {
        if (err) {
          reject(err);
          return;
        }

        selectedQuestions.push(...questions);
        completedDifficulties++;

        if (completedDifficulties === difficulties.length) {
          resolve(selectedQuestions);
        }
      });
    });
  });
}

// 테스트 완료 처리
router.post('/:sessionId/complete', requireCandidate, (req, res) => {
  const { sessionId } = req.params;
  const { reason = 'completed' } = req.body; // completed, time-expired, cheating
  const candidateId = req.user.userId;

  db.get(
    'SELECT * FROM test_sessions WHERE id = ? AND candidate_id = ?',
    [sessionId, candidateId],
    (err, session) => {
      if (err) {
        console.error('테스트 세션 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      if (!session) {
        return res.status(404).json({
          success: false,
          message: '테스트 세션을 찾을 수 없습니다.'
        });
      }

      if (session.status !== 'in-progress') {
        return res.status(400).json({
          success: false,
          message: '진행 중인 테스트가 아닙니다.'
        });
      }

      // 테스트 세션 완료 처리
      const updateSession = async () => {
        const statusField = reason === 'completed' ? 'completed' : 'terminated';
        const dateField = reason === 'completed' ? 'completed_at' : 'terminated_at';
        
        try {
          // 1. 테스트 세션 상태 업데이트
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE test_sessions SET status = ?, ${dateField} = datetime('now'), 
               termination_reason = ?, updated_at = datetime('now') WHERE id = ?`,
              [statusField, reason === 'completed' ? null : reason, sessionId],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          // 2. 지원자 상태를 evaluated로 변경
          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE users SET status = "evaluated", updated_at = datetime("now") WHERE id = ?',
              [candidateId],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          // 3. 자동 평가 수행
          console.log(`🎯 테스트 완료 후 자동 평가 시작 - 세션: ${sessionId}, 사유: ${reason}`);
          const evaluationResult = await performTestCompletionEvaluation(sessionId, candidateId, 'system');

          if (evaluationResult.success) {
            console.log(`✅ 테스트 완료 및 자동 평가 성공 - 총점: ${evaluationResult.evaluation.totalScore}%`);
            
            res.json({
              success: true,
              message: '테스트가 완료되고 자동 채점이 완료되었습니다.',
              data: {
                sessionId,
                status: statusField,
                reason: reason,
                completedAt: new Date(),
                evaluation: {
                  totalScore: evaluationResult.evaluation.totalScore,
                  technicalScore: evaluationResult.evaluation.technicalScore,
                  personalityScore: evaluationResult.evaluation.personalityScore,
                  problemSolvingScore: evaluationResult.evaluation.problemSolvingScore,
                  evaluatedAt: new Date()
                }
              }
            });
          } else {
            // 평가 실패해도 테스트 완료는 성공으로 처리
            console.warn(`⚠️  자동 평가 실패: ${evaluationResult.message}`);
            
            res.json({
              success: true,
              message: '테스트가 완료되었습니다. 평가는 관리자가 수동으로 진행할 예정입니다.',
              data: {
                sessionId,
                status: statusField,
                reason: reason,
                completedAt: new Date(),
                evaluation: null,
                evaluationNote: '자동 평가 실패 - 수동 평가 필요'
              }
            });
          }

        } catch (error) {
          console.error('테스트 완료 처리 오류:', error);
          res.status(500).json({
            success: false,
            message: '테스트 완료 처리 중 오류가 발생했습니다.'
          });
        }
      };

      updateSession();
    }
  );
});

// 관리자용 테스트 세션 목록 조회 (관리자만)
router.get('/admin/list', requireAdmin, (req, res) => {
  const { page = 1, limit = 10, status, candidateName, appliedField, evaluation } = req.query;
  const offset = (page - 1) * limit;

  // 디버깅: 받은 필터 파라미터 로그
  console.log('📥 테스트 세션 목록 조회 - 필터 파라미터:', {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    candidateName,
    appliedField,
    evaluation
  });

  let query = `
    SELECT 
      ts.id,
      ts.candidate_id,
      ts.status,
      ts.started_at,
      ts.completed_at,
      ts.terminated_at,
      ts.termination_reason,
      ts.total_time,
      ts.cheating_attempts,
      ts.focus_lost_count,
      ts.created_at,
      u.name as candidate_name,
      u.email as candidate_email,
      u.applied_field,
      u.experience,
      e.id as evaluation_id,
      e.total_score,
      e.technical_score,
      e.personality_score,
      e.problem_solving_score,
      e.status as evaluation_status
    FROM test_sessions ts
    JOIN users u ON ts.candidate_id = u.id
    LEFT JOIN evaluations e ON ts.id = e.test_session_id
    WHERE u.role = 'candidate'
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM test_sessions ts
    JOIN users u ON ts.candidate_id = u.id
    LEFT JOIN evaluations e ON ts.id = e.test_session_id
    WHERE u.role = 'candidate'
  `;

  const params = [];
  const conditions = [];

  // 상태 필터
  if (status) {
    conditions.push('ts.status = ?');
    params.push(status);
  }

  // 지원자 이름 검색
  if (candidateName) {
    conditions.push('u.name LIKE ?');
    params.push(`%${candidateName}%`);
  }

  // 지원 분야 필터
  if (appliedField) {
    conditions.push('u.applied_field = ?');
    params.push(appliedField);
  }

  // 평가 상태 필터
  if (evaluation) {
    if (evaluation === 'pending') {
      // 테스트는 완료되었지만(completed 또는 terminated) 평가가 아직 안된 경우
      conditions.push('(e.id IS NULL OR e.status != "completed") AND ts.status IN ("completed", "terminated")');
    } else if (evaluation === 'completed') {
      // 평가가 완료된 경우
      conditions.push('e.id IS NOT NULL AND e.status = "completed"');
    }
  }

  // 조건 추가
  if (conditions.length > 0) {
    const whereClause = ' AND ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  // 디버깅: 생성된 조건과 최종 쿼리 로그
  console.log('🔍 생성된 조건:', conditions);
  console.log('📊 최종 쿼리 파라미터:', params);
  console.log('🗃️ 실행할 쿼리:', query.replace(/\s+/g, ' ').trim());

  // 정렬 및 페이징
  query += ' ORDER BY ts.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  // 총 개수 조회
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) {
      console.error('테스트 세션 개수 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    // 목록 조회
    db.all(query, params, (err, sessions) => {
      if (err) {
        console.error('테스트 세션 목록 조회 오류:', err);
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
          sessions: sessions.map(session => ({
            id: session.id,
            candidateId: session.candidate_id,
            candidateName: session.candidate_name,
            candidateEmail: session.candidate_email,
            appliedField: session.applied_field,
            experience: session.experience,
            status: session.status,
            startedAt: session.started_at ? new Date(session.started_at) : null,
            completedAt: session.completed_at ? new Date(session.completed_at) : null,
            terminatedAt: session.terminated_at ? new Date(session.terminated_at) : null,
            terminationReason: session.termination_reason,
            totalTime: session.total_time,
            cheatingAttempts: session.cheating_attempts,
            focusLostCount: session.focus_lost_count,
            createdAt: new Date(session.created_at),
            evaluation: session.evaluation_id ? {
              id: session.evaluation_id,
              totalScore: session.total_score,
              technicalScore: session.technical_score,
              personalityScore: session.personality_score,
              problemSolvingScore: session.problem_solving_score,
              status: session.evaluation_status
            } : null
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

// 테스트 세션 조회
router.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  let query = 'SELECT * FROM test_sessions WHERE id = ?';
  let params = [sessionId];

  // 지원자는 본인 세션만 조회 가능
  if (userRole === 'candidate') {
    query += ' AND candidate_id = ?';
    params.push(userId);
  }

  db.get(query, params, (err, session) => {
    if (err) {
      console.error('테스트 세션 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '테스트 세션을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        ...session,
        questions: session.questions ? JSON.parse(session.questions) : null,
        answers: session.answers ? JSON.parse(session.answers) : null,
        startedAt: session.started_at ? new Date(session.started_at) : null,
        completedAt: session.completed_at ? new Date(session.completed_at) : null,
        terminatedAt: session.terminated_at ? new Date(session.terminated_at) : null,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at)
      }
    });
  });
});

// 답안 제출
router.post('/:sessionId/answers', requireCandidate, (req, res) => {
  const { sessionId } = req.params;
  const { questionId, answer, answerText } = req.body;
  const candidateId = req.user.userId;

  if (!questionId || (answer === undefined && !answerText)) {
    return res.status(400).json({
      success: false,
      message: '답안 정보가 누락되었습니다.'
    });
  }

  db.get(
    'SELECT * FROM test_sessions WHERE id = ? AND candidate_id = ?',
    [sessionId, candidateId],
    (err, session) => {
      if (err) {
        console.error('테스트 세션 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      if (!session) {
        return res.status(404).json({
          success: false,
          message: '테스트 세션을 찾을 수 없습니다.'
        });
      }

      if (session.status !== 'in-progress') {
        return res.status(400).json({
          success: false,
          message: '진행 중인 테스트가 아닙니다.'
        });
      }

      // 현재 답안들 가져오기 (배열 형태)
      let currentAnswers = session.answers ? JSON.parse(session.answers) : [];
      
      // 기존 답안 중 같은 questionId 찾기
      const existingIndex = currentAnswers.findIndex(a => a.id === questionId);
      
      // 새 답안 데이터 생성 (불필요한 필드 제거)
      const newAnswerData = {
        id: questionId,
        submittedAt: new Date().toISOString()
      };
      
      // 답안 타입에 따라 적절한 필드만 추가
      if (typeof answer === 'number') {
        // 객관식 (multiple-choice)
        newAnswerData.answer = answer;
      } else if (answerText && answerText.trim()) {
        // 주관식 (essay)
        newAnswerData.answerText = answerText.trim();
      } else {
        return res.status(400).json({
          success: false,
          message: '올바른 답안 형식이 아닙니다.'
        });
      }
      
      // questionOrder 추가 (질문 목록에서 순서 찾기)
      const questions = JSON.parse(session.questions);
      const questionIndex = questions.findIndex(q => q.id === questionId);
      if (questionIndex !== -1) {
        newAnswerData.questionOrder = questionIndex + 1;
      }
      
      // 기존 답안 업데이트 또는 새로 추가
      if (existingIndex !== -1) {
        currentAnswers[existingIndex] = newAnswerData;
      } else {
        currentAnswers.push(newAnswerData);
      }
      
      // questionOrder 순으로 정렬
      currentAnswers.sort((a, b) => (a.questionOrder || 0) - (b.questionOrder || 0));

      // 답안 저장
      db.run(
        'UPDATE test_sessions SET answers = ?, updated_at = datetime("now") WHERE id = ?',
        [JSON.stringify(currentAnswers), sessionId],
        function(err) {
          if (err) {
            console.error('답안 저장 오류:', err);
            return res.status(500).json({
              success: false,
              message: '답안 저장 중 오류가 발생했습니다.'
            });
          }

          res.json({
            success: true,
            message: '답안이 저장되었습니다.',
            data: {
              questionId,
              savedAt: new Date()
            }
          });
        }
      );
    }
  );
});

// 부정행위 신고 (포커스 이탈)
router.post('/:sessionId/focus-lost', requireCandidate, async (req, res) => {
  const { sessionId } = req.params;
  const candidateId = req.user.userId;

  console.log(`🔍 포커스 이탈 처리 요청 - 세션: ${sessionId}, 지원자: ${candidateId}`);

  try {
    // 1. 테스트 세션 조회 (상태 확인 포함)
    const session = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, focus_lost_count, status FROM test_sessions WHERE id = ? AND candidate_id = ?',
        [sessionId, candidateId],
        (err, session) => {
          if (err) reject(err);
          else resolve(session);
        }
      );
    });

    if (!session) {
      console.warn(`❌ 세션 조회 실패 - 세션: ${sessionId}, 지원자: ${candidateId}`);
      return res.status(404).json({
        success: false,
        message: '테스트 세션을 찾을 수 없습니다.'
      });
    }

    // 테스트가 이미 종료된 경우 포커스 이탈 처리 거부
    if (session.status !== 'in-progress') {
      console.log(`⏭️  포커스 이탈 처리 스킵 - 테스트 이미 종료됨 (상태: ${session.status})`);
      return res.status(400).json({
        success: false,
        message: '이미 종료된 테스트입니다.',
        data: {
          sessionStatus: session.status,
          reason: 'test_already_finished'
        }
      });
    }

    const maxAttempts = 3; // 허용 횟수
    const currentFocusLostCount = session.focus_lost_count || 0; // NULL 처리
    const newFocusLostCount = currentFocusLostCount + 1;

    console.log(`📊 포커스 이탈 카운트 업데이트 - 현재: ${currentFocusLostCount}, 신규: ${newFocusLostCount}, 최대: ${maxAttempts}`);

    // 2. 포커스 이탈 카운트 업데이트
    const updateResult = await new Promise((resolve, reject) => {
      db.run(
        'UPDATE test_sessions SET focus_lost_count = ?, updated_at = datetime("now") WHERE id = ?',
        [newFocusLostCount, sessionId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });

    if (updateResult === 0) {
      console.warn(`❌ 포커스 이탈 카운트 업데이트 실패 - 세션: ${sessionId}`);
      return res.status(500).json({
        success: false,
        message: '포커스 이탈 처리 중 오류가 발생했습니다.'
      });
    }

    // 3. 허용 한계 초과 시 테스트 종료 및 평가
    if (newFocusLostCount >= maxAttempts) {
      console.log(`🚨 부정행위 감지로 테스트 자동 종료 - 세션: ${sessionId}, 이탈 횟수: ${newFocusLostCount}/${maxAttempts}`);
      
      // 3-1. 테스트 세션 종료 처리
      const terminateResult = await new Promise((resolve, reject) => {
        db.run(
          `UPDATE test_sessions SET status = "terminated", terminated_at = datetime("now"), 
           termination_reason = "cheating" WHERE id = ?`,
          [sessionId],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.changes);
            }
          }
        );
      });

      if (terminateResult === 0) {
        console.warn(`❌ 테스트 세션 종료 처리 실패 - 세션: ${sessionId}`);
      } else {
        console.log(`✅ 테스트 세션 종료 완료 - 세션: ${sessionId}`);
      }

      // 3-2. 지원자 상태를 evaluated로 변경
      const candidateUpdateResult = await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET status = "evaluated", updated_at = datetime("now") WHERE id = ?',
          [candidateId],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.changes);
            }
          }
        );
      });

      if (candidateUpdateResult === 0) {
        console.warn(`❌ 지원자 상태 업데이트 실패 - 지원자: ${candidateId}`);
      } else {
        console.log(`✅ 지원자 상태 업데이트 완료 - 지원자: ${candidateId}`);
      }

      // 3-3. 자동 평가 수행 (부정행위여도 제출된 답안까지는 채점)
      console.log(`🎯 부정행위 종료 후 자동 평가 시작 - 세션: ${sessionId}`);
      const evaluationResult = await performTestCompletionEvaluation(sessionId, candidateId, 'system');

      if (evaluationResult.success) {
        console.log(`✅ 부정행위 종료 및 자동 평가 성공 - 총점: ${evaluationResult.evaluation.totalScore}%`);
        
        res.json({
          success: false,
          message: '부정행위가 감지되어 테스트가 종료되었습니다. 제출된 답안까지만 채점되었습니다.',
          data: {
            terminated: true,
            focusLostCount: newFocusLostCount,
            maxAttempts: maxAttempts,
            reason: 'cheating',
            evaluation: {
              totalScore: evaluationResult.evaluation.totalScore,
              technicalScore: evaluationResult.evaluation.technicalScore,
              personalityScore: evaluationResult.evaluation.personalityScore,
              problemSolvingScore: evaluationResult.evaluation.problemSolvingScore,
              evaluatedAt: new Date(),
              note: '부정행위로 인한 조기 종료 - 제출된 답안까지만 채점'
            }
          }
        });
      } else {
        // 평가 실패해도 테스트 종료는 성공으로 처리
        console.warn(`⚠️  부정행위 종료 후 자동 평가 실패: ${evaluationResult.message}`);
        
        res.json({
          success: false,
          message: '부정행위가 감지되어 테스트가 종료되었습니다. 평가는 관리자가 수동으로 진행할 예정입니다.',
          data: {
            terminated: true,
            focusLostCount: newFocusLostCount,
            maxAttempts: maxAttempts,
            reason: 'cheating',
            evaluation: null,
            evaluationNote: '자동 평가 실패 - 수동 평가 필요'
          }
        });
      }

    } else {
      // 아직 허용 범위 내
      const remainingAttempts = maxAttempts - newFocusLostCount;
      console.log(`⚠️  포커스 이탈 경고 - 세션: ${sessionId}, 이탈 횟수: ${newFocusLostCount}/${maxAttempts}, 남은 기회: ${remainingAttempts}`);
      
      res.json({
        success: true,
        message: '포커스 이탈이 기록되었습니다.',
        data: {
          focusLostCount: newFocusLostCount,
          maxAttempts: maxAttempts,
          remainingAttempts: remainingAttempts,
          warning: `${remainingAttempts}회 더 포커스를 잃으면 테스트가 종료됩니다.`
        }
      });
    }

  } catch (error) {
    console.error('❌ 포커스 이탈 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 남은 시간 업데이트
router.post('/:sessionId/time', requireCandidate, async (req, res) => {
  const { sessionId } = req.params;
  const { remainingTime } = req.body;
  const candidateId = req.user.userId;

  if (typeof remainingTime !== 'number' || remainingTime < 0) {
    return res.status(400).json({
      success: false,
      message: '올바른 시간 정보를 입력해주세요.'
    });
  }

  try {
    // 1. 남은 시간 업데이트
    const updateResult = await new Promise((resolve, reject) => {
      db.run(
        'UPDATE test_sessions SET remaining_time = ?, updated_at = datetime("now") WHERE id = ? AND candidate_id = ? AND status = "in-progress"',
        [remainingTime, sessionId, candidateId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });

    if (updateResult === 0) {
      return res.status(404).json({
        success: false,
        message: '진행 중인 테스트 세션을 찾을 수 없습니다.'
      });
    }

    // 2. 시간이 0이 되면 자동 완료 및 평가
    if (remainingTime <= 0) {
      console.log(`⏰ 시간 만료로 테스트 자동 완료 - 세션: ${sessionId}`);
      
      // 2-1. 테스트 세션 완료 처리
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE test_sessions SET status = "completed", completed_at = datetime("now"), 
           termination_reason = "time-expired" WHERE id = ?`,
          [sessionId],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // 2-2. 지원자 상태를 evaluated로 변경
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET status = "evaluated", updated_at = datetime("now") WHERE id = ?',
          [candidateId],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // 2-3. 자동 평가 수행
      console.log(`🎯 시간 만료 후 자동 평가 시작 - 세션: ${sessionId}`);
      const evaluationResult = await performTestCompletionEvaluation(sessionId, candidateId, 'system');

      if (evaluationResult.success) {
        console.log(`✅ 시간 만료 완료 및 자동 평가 성공 - 총점: ${evaluationResult.evaluation.totalScore}%`);
        
        res.json({
          success: true,
          message: '시간이 만료되어 테스트가 자동 완료되고 채점이 완료되었습니다.',
          data: {
            remainingTime: 0,
            completed: true,
            reason: 'time-expired',
            evaluation: {
              totalScore: evaluationResult.evaluation.totalScore,
              technicalScore: evaluationResult.evaluation.technicalScore,
              personalityScore: evaluationResult.evaluation.personalityScore,
              problemSolvingScore: evaluationResult.evaluation.problemSolvingScore,
              evaluatedAt: new Date()
            }
          }
        });
      } else {
        // 평가 실패해도 테스트 완료는 성공으로 처리
        console.warn(`⚠️  시간 만료 후 자동 평가 실패: ${evaluationResult.message}`);
        
        res.json({
          success: true,
          message: '시간이 만료되어 테스트가 자동 완료되었습니다. 평가는 관리자가 수동으로 진행할 예정입니다.',
          data: {
            remainingTime: 0,
            completed: true,
            reason: 'time-expired',
            evaluation: null,
            evaluationNote: '자동 평가 실패 - 수동 평가 필요'
          }
        });
      }
    } else {
      res.json({
        success: true,
        message: '남은 시간이 업데이트되었습니다.',
        data: {
          remainingTime: remainingTime
        }
      });
    }

  } catch (error) {
    console.error('남은 시간 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 개발용 테스트 데이터 초기화 (지원자 본인만 가능)
router.post('/reset', requireCandidate, async (req, res) => {
  const candidateId = req.user.userId;
  
  // 개발 환경에서만 허용 (선택사항)
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: '프로덕션 환경에서는 지원되지 않는 기능입니다.'
    });
  }

  try {
    console.log(`🔄 테스트 상태 초기화 시작 - 지원자: ${candidateId}`);
    
    // 지원자 정보 조회 (현재 상태 확인)
    const currentUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, status, test_session_id FROM users WHERE id = ? AND role = "candidate"',
        [candidateId],
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: '지원자 정보를 찾을 수 없습니다.'
      });
    }

    console.log(`📋 현재 지원자 상태: ${currentUser.status}, 테스트 세션: ${currentUser.test_session_id || 'None'}`);

    // 지원자 상태를 pending으로 변경하고 test_session_id 연결 해제
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET status = "pending", test_session_id = NULL, updated_at = datetime("now") WHERE id = ?',
        [candidateId],
        function(err) {
          if (err) reject(err);
          else {
            console.log(`🔄 지원자 상태 pending으로 변경 완료 (기존: ${currentUser.status} → 신규: pending)`);
            resolve();
          }
        }
      );
    });

    console.log(`✅ 테스트 상태 초기화 완료 - 지원자: ${candidateId}`);
    console.log(`📝 참고: 기존 테스트 세션 및 평가 기록은 보존됩니다.`);

    res.json({
      success: true,
      message: '테스트 상태가 초기화되었습니다. 새로운 테스트를 시작할 수 있습니다.',
      data: {
        candidateId,
        resetAt: new Date().toISOString(),
        previousStatus: currentUser.status,
        newStatus: 'pending',
        note: '기존 테스트 기록은 보존되었습니다.'
      }
    });

  } catch (error) {
    console.error('테스트 상태 초기화 오류:', error);
    res.status(500).json({
      success: false,
      message: '테스트 상태 초기화 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 