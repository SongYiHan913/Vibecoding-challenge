const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { performAutoEvaluation, performTestCompletionEvaluation } = require('../utils/evaluation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Evaluations
 *   description: 면접 평가 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Evaluation:
 *       type: object
 *       required:
 *         - test_session_id
 *         - question_id
 *         - score
 *         - feedback
 *       properties:
 *         id:
 *           type: integer
 *           description: 평가 ID
 *         test_session_id:
 *           type: integer
 *           description: 면접 세션 ID
 *         question_id:
 *           type: integer
 *           description: 질문 ID
 *         score:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: 평가 점수 (1-5)
 *         feedback:
 *           type: string
 *           description: 평가 피드백
 *         evaluator_notes:
 *           type: string
 *           description: 평가자 메모
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 생성 일시
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 수정 일시
 */

/**
 * @swagger
 * /api/evaluations:
 *   get:
 *     summary: 모든 평가 목록 조회
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: test_session_id
 *         schema:
 *           type: integer
 *         description: 면접 세션 ID로 필터링
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
 *     responses:
 *       200:
 *         description: 평가 목록 조회 성공
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
 *                     $ref: '#/components/schemas/Evaluation'
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
 *     summary: 새 평가 등록
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - test_session_id
 *               - question_id
 *               - score
 *               - feedback
 *             properties:
 *               test_session_id:
 *                 type: integer
 *               question_id:
 *                 type: integer
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               feedback:
 *                 type: string
 *               evaluator_notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: 평가 등록 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 세션 또는 질문을 찾을 수 없음
 */

/**
 * @swagger
 * /api/evaluations/{id}:
 *   get:
 *     summary: 특정 평가 조회
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 평가 ID
 *     responses:
 *       200:
 *         description: 평가 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evaluation'
 *       404:
 *         description: 평가를 찾을 수 없음
 *
 *   put:
 *     summary: 평가 수정
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 평가 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               feedback:
 *                 type: string
 *               evaluator_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: 평가 수정 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 평가를 찾을 수 없음
 *
 *   delete:
 *     summary: 평가 삭제
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 평가 ID
 *     responses:
 *       200:
 *         description: 평가 삭제 성공
 *       404:
 *         description: 평가를 찾을 수 없음
 */

/**
 * @swagger
 * /api/evaluations/session/{sessionId}/summary:
 *   get:
 *     summary: 면접 세션의 평가 요약 조회
 *     tags: [Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 면접 세션 ID
 *     responses:
 *       200:
 *         description: 평가 요약 조회 성공
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
 *                     average_score:
 *                       type: number
 *                       description: 평균 점수
 *                     total_questions:
 *                       type: integer
 *                       description: 총 질문 수
 *                     evaluated_questions:
 *                       type: integer
 *                       description: 평가 완료된 질문 수
 *                     category_scores:
 *                       type: object
 *                       description: 카테고리별 평균 점수
 *       404:
 *         description: 세션을 찾을 수 없음
 */

// 모든 라우트에 인증 필요
router.use(authenticateToken);

// 평가 생성 (관리자만)
router.post('/', requireAdmin, async (req, res) => {
  const { candidateId, testSessionId } = req.body;
  const evaluatorId = req.user.userId;

  if (!candidateId || !testSessionId) {
    return res.status(400).json({
      success: false,
      message: '필수 정보가 누락되었습니다.'
    });
  }

  try {
    // 테스트 세션과 답안 조회
    const session = await new Promise((resolve, reject) => {
      db.get(
        `SELECT ts.*, u.applied_field, u.experience 
         FROM test_sessions ts 
         JOIN users u ON ts.candidate_id = u.id 
         WHERE ts.id = ? AND ts.candidate_id = ? AND ts.status = 'completed'`,
        [testSessionId, candidateId],
        (err, session) => {
          if (err) reject(err);
          else resolve(session);
        }
      );
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '완료된 테스트 세션을 찾을 수 없습니다.'
      });
    }

    // 이미 평가가 있는지 확인
    const existingEvaluation = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM evaluations WHERE test_session_id = ?',
        [testSessionId],
        (err, evaluation) => {
          if (err) reject(err);
          else resolve(evaluation);
        }
      );
    });

    if (existingEvaluation) {
      return res.status(400).json({
        success: false,
        message: '이미 평가가 완료된 테스트입니다.'
      });
    }

    // 자동 평가 수행
    const evaluationResult = await performAutoEvaluation(session, evaluatorId);
    
    res.status(201).json({
      success: true,
      message: '평가가 완료되었습니다.',
      data: evaluationResult
    });

  } catch (error) {
    console.error('평가 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '평가 처리 중 오류가 발생했습니다.'
    });
  }
});

// 평가 목록 조회 (관리자만)
router.get('/', requireAdmin, (req, res) => {
  const { page = 1, limit = 10, minScore, maxScore } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT e.*, u.name as candidate_name, u.email as candidate_email, u.applied_field
    FROM evaluations e
    JOIN users u ON e.candidate_id = u.id
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM evaluations e';
  const params = [];
  const conditions = [];

  // 점수 필터
  if (minScore) {
    conditions.push('e.total_score >= ?');
    params.push(parseFloat(minScore));
  }

  if (maxScore) {
    conditions.push('e.total_score <= ?');
    params.push(parseFloat(maxScore));
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  // 총 개수 조회
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) {
      console.error('평가 개수 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    // 평가 목록 조회
    db.all(query, params, (err, evaluations) => {
      if (err) {
        console.error('평가 목록 조회 오류:', err);
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
          evaluations: evaluations.map(evaluation => ({
            id: evaluation.id,
            candidateId: evaluation.candidate_id,
            candidateName: evaluation.candidate_name,
            candidateEmail: evaluation.candidate_email,
            appliedField: evaluation.applied_field,
            testSessionId: evaluation.test_session_id,
            technicalScore: evaluation.technical_score,
            personalityScore: evaluation.personality_score,
            problemSolvingScore: evaluation.problem_solving_score,
            totalScore: evaluation.total_score,
            status: evaluation.status,
            evaluatedAt: new Date(evaluation.evaluated_at),
            createdAt: new Date(evaluation.created_at)
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

// 특정 평가 조회
router.get('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT e.*, u.name as candidate_name, u.email as candidate_email, 
           u.phone as candidate_phone, u.applied_field, u.experience
    FROM evaluations e
    JOIN users u ON e.candidate_id = u.id
    WHERE e.id = ?
  `;

  db.get(query, [id], (err, evaluation) => {
    if (err) {
      console.error('평가 조회 오류:', err);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: '평가를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        id: evaluation.id,
        candidate: {
          id: evaluation.candidate_id,
          name: evaluation.candidate_name,
          email: evaluation.candidate_email,
          phone: evaluation.candidate_phone,
          appliedField: evaluation.applied_field,
          experience: evaluation.experience
        },
        testSessionId: evaluation.test_session_id,
        scores: {
          technical: evaluation.technical_score,
          personality: evaluation.personality_score,
          problemSolving: evaluation.problem_solving_score,
          total: evaluation.total_score
        },
        detailedResults: evaluation.detailed_results ? JSON.parse(evaluation.detailed_results) : null,
        llmEvaluations: evaluation.llm_evaluations ? JSON.parse(evaluation.llm_evaluations) : null,
        status: evaluation.status,
        notes: evaluation.notes,
        evaluatedAt: new Date(evaluation.evaluated_at),
        createdAt: new Date(evaluation.created_at)
      }
    });
  });
});

// 평가 메모 추가/수정 (관리자만)
router.patch('/:id/notes', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  db.run(
    'UPDATE evaluations SET notes = ?, updated_at = datetime("now") WHERE id = ?',
    [notes || null, id],
    function(err) {
      if (err) {
        console.error('평가 메모 수정 오류:', err);
        return res.status(500).json({
          success: false,
          message: '메모 수정 중 오류가 발생했습니다.'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: '평가를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '메모가 수정되었습니다.'
      });
    }
  );
});

// 평가 점수 수정 (관리자만)
router.patch('/:id/scores', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { detailedResults, notes, finalizeGrading = false } = req.body;
  const evaluatorId = req.user.userId;

  if (!detailedResults || !Array.isArray(detailedResults)) {
    return res.status(400).json({
      success: false,
      message: '세부 평가 결과가 필요합니다.'
    });
  }

  // 기존 평가 정보 조회
  db.get(
    'SELECT * FROM evaluations WHERE id = ?',
    [id],
    (err, evaluation) => {
      if (err) {
        console.error('평가 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.'
        });
      }

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: '평가를 찾을 수 없습니다.'
        });
      }

      // 기존 세부 결과 파싱
      const existingResults = evaluation.detailed_results ? JSON.parse(evaluation.detailed_results) : [];
      
      // 점수 검증 및 계산
      let technicalScore = 0;
      let personalityScore = 0;
      let problemSolvingScore = 0;
      let technicalTotal = 0;
      let personalityTotal = 0;
      let problemSolvingTotal = 0;

      // 각 문제별 점수 검증
      for (const result of detailedResults) {
        const { questionId, score, maxScore, type } = result;
        
        if (score > maxScore) {
          return res.status(400).json({
            success: false,
            message: `문제 ${questionId}의 점수가 최대 점수를 초과했습니다. (${score}/${maxScore})`
          });
        }

        if (score < 0) {
          return res.status(400).json({
            success: false,
            message: `문제 ${questionId}의 점수는 0 이상이어야 합니다.`
          });
        }

        // 타입별 점수 누적
        if (type === 'technical') {
          technicalScore += score;
          technicalTotal += maxScore;
        } else if (type === 'personality') {
          personalityScore += score;
          personalityTotal += maxScore;
        } else if (type === 'problem-solving') {
          problemSolvingScore += score;
          problemSolvingTotal += maxScore;
        }
      }

      // 백분율 계산
      const technicalPercent = technicalTotal > 0 ? (technicalScore / technicalTotal) * 100 : 0;
      const personalityPercent = personalityTotal > 0 ? (personalityScore / personalityTotal) * 100 : 0;
      const problemSolvingPercent = problemSolvingTotal > 0 ? (problemSolvingScore / problemSolvingTotal) * 100 : 0;

      // 전체 점수 계산 (가중 평균)
      const TECHNICAL_WEIGHT = 0.4;
      const PERSONALITY_WEIGHT = 0.3;
      const PROBLEM_SOLVING_WEIGHT = 0.3;

      const totalScore = 
        (technicalPercent * TECHNICAL_WEIGHT) +
        (personalityPercent * PERSONALITY_WEIGHT) +
        (problemSolvingPercent * PROBLEM_SOLVING_WEIGHT);

      // 평가 결과 업데이트
      db.run(
        `UPDATE evaluations SET 
          technical_score = ?, 
          personality_score = ?, 
          problem_solving_score = ?, 
          total_score = ?, 
          detailed_results = ?, 
          notes = ?, 
          evaluated_by = ?, 
          updated_at = datetime('now')
        WHERE id = ?`,
        [
          Math.round(technicalPercent * 100) / 100,
          Math.round(personalityPercent * 100) / 100,
          Math.round(problemSolvingPercent * 100) / 100,
          Math.round(totalScore * 100) / 100,
          JSON.stringify(detailedResults),
          notes || evaluation.notes,
          evaluatorId,
          id
        ],
        function(err) {
          if (err) {
            console.error('평가 점수 수정 오류:', err);
            return res.status(500).json({
              success: false,
              message: '점수 수정 중 오류가 발생했습니다.'
            });
          }

          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              message: '평가를 찾을 수 없습니다.'
            });
          }

          // 채점 완료 처리
          if (finalizeGrading) {
            // test_session 상태를 terminated로 변경
            db.run(
              `UPDATE test_sessions SET 
                status = 'terminated', 
                terminated_at = datetime('now'),
                termination_reason = 'grading_completed',
                updated_at = datetime('now')
              WHERE id = ?`,
              [evaluation.test_session_id],
              function(err) {
                if (err) {
                  console.error('테스트 세션 상태 변경 오류:', err);
                  return res.status(500).json({
                    success: false,
                    message: '채점 완료 처리 중 오류가 발생했습니다.'
                  });
                }

                res.json({
                  success: true,
                  message: '채점이 완료되었습니다.',
                  data: {
                    technicalScore: Math.round(technicalPercent * 100) / 100,
                    personalityScore: Math.round(personalityPercent * 100) / 100,
                    problemSolvingScore: Math.round(problemSolvingPercent * 100) / 100,
                    totalScore: Math.round(totalScore * 100) / 100,
                    status: 'terminated',
                    updatedAt: new Date()
                  }
                });
              }
            );
          } else {
            res.json({
              success: true,
              message: '평가 점수가 수정되었습니다.',
              data: {
                technicalScore: Math.round(technicalPercent * 100) / 100,
                personalityScore: Math.round(personalityPercent * 100) / 100,
                problemSolvingScore: Math.round(problemSolvingPercent * 100) / 100,
                totalScore: Math.round(totalScore * 100) / 100,
                updatedAt: new Date()
              }
            });
          }
        }
      );
    }
  );
});



module.exports = router; 