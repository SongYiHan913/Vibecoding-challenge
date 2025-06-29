const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(authenticateToken);

// 평가 생성 (관리자만)
router.post('/', requireAdmin, (req, res) => {
  const { candidateId, testSessionId } = req.body;
  const evaluatorId = req.user.userId;

  if (!candidateId || !testSessionId) {
    return res.status(400).json({
      success: false,
      message: '필수 정보가 누락되었습니다.'
    });
  }

  // 테스트 세션과 답안 조회
  db.get(
    `SELECT ts.*, u.applied_field, u.experience 
     FROM test_sessions ts 
     JOIN users u ON ts.candidate_id = u.id 
     WHERE ts.id = ? AND ts.candidate_id = ? AND ts.status = 'completed'`,
    [testSessionId, candidateId],
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
          message: '완료된 테스트 세션을 찾을 수 없습니다.'
        });
      }

      // 이미 평가가 있는지 확인
      db.get(
        'SELECT id FROM evaluations WHERE test_session_id = ?',
        [testSessionId],
        (err, existingEvaluation) => {
          if (err) {
            console.error('기존 평가 확인 오류:', err);
            return res.status(500).json({
              success: false,
              message: '서버 오류가 발생했습니다.'
            });
          }

          if (existingEvaluation) {
            return res.status(400).json({
              success: false,
              message: '이미 평가가 완료된 테스트입니다.'
            });
          }

          // 자동 평가 수행
          performAutoEvaluation(session, evaluatorId, (err, evaluationResult) => {
            if (err) {
              console.error('자동 평가 오류:', err);
              return res.status(500).json({
                success: false,
                message: '평가 처리 중 오류가 발생했습니다.'
              });
            }

            res.status(201).json({
              success: true,
              message: '평가가 완료되었습니다.',
              data: evaluationResult
            });
          });
        }
      );
    }
  );
});

// 자동 평가 함수
function performAutoEvaluation(session, evaluatorId, callback) {
  const questions = JSON.parse(session.questions);
  const answers = JSON.parse(session.answers || '{}');
  
  let technicalScore = 0;
  let personalityScore = 0;
  let problemSolvingScore = 0;
  let maxTechnicalScore = 0;
  let maxPersonalityScore = 0;
  let maxProblemSolvingScore = 0;

  const detailedResults = [];

  // 각 질문별 채점
  questions.forEach(question => {
    const userAnswer = answers[question.id];
    let score = 0;
    let maxScore = question.points;

    if (userAnswer) {
      if (question.format === 'multiple-choice') {
        // 객관식 채점
        if (userAnswer.answer === question.correct_answer) {
          score = maxScore;
        }
      } else if (question.format === 'essay') {
        // 주관식 채점 (키워드 기반)
        if (question.required_keywords && userAnswer.answerText) {
          const keywords = JSON.parse(question.required_keywords);
          const answerText = userAnswer.answerText.toLowerCase();
          const matchedKeywords = keywords.filter(keyword => 
            answerText.includes(keyword.toLowerCase())
          );
          score = Math.round((matchedKeywords.length / keywords.length) * maxScore);
        }
      }
    }

    // 타입별 점수 집계
    switch (question.type) {
      case 'technical':
        technicalScore += score;
        maxTechnicalScore += maxScore;
        break;
      case 'personality':
        personalityScore += score;
        maxPersonalityScore += maxScore;
        break;
      case 'problem-solving':
        problemSolvingScore += score;
        maxProblemSolvingScore += maxScore;
        break;
    }

    detailedResults.push({
      questionId: question.id,
      type: question.type,
      question: question.question,
      userAnswer: userAnswer || null,
      correctAnswer: question.correct_answer || question.correct_answer_text,
      score,
      maxScore,
      points: question.points
    });
  });

  // 백분율 점수 계산
  const technicalPercent = maxTechnicalScore > 0 ? (technicalScore / maxTechnicalScore) * 100 : 0;
  const personalityPercent = maxPersonalityScore > 0 ? (personalityScore / maxPersonalityScore) * 100 : 0;
  const problemSolvingPercent = maxProblemSolvingScore > 0 ? (problemSolvingScore / maxProblemSolvingScore) * 100 : 0;

  // 가중치 적용하여 총점 계산 (기술 40%, 인성 20%, 문제해결 40%)
  const totalScore = (technicalPercent * 0.4) + (personalityPercent * 0.2) + (problemSolvingPercent * 0.4);

  const evaluationId = uuidv4();

  // 평가 결과 저장
  db.run(
    `INSERT INTO evaluations (
      id, candidate_id, test_session_id, technical_score, personality_score, 
      problem_solving_score, total_score, detailed_results, evaluated_at, 
      evaluated_by, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 'completed', datetime('now'), datetime('now'))`,
    [
      evaluationId, session.candidate_id, session.id,
      Math.round(technicalPercent * 100) / 100,
      Math.round(personalityPercent * 100) / 100,
      Math.round(problemSolvingPercent * 100) / 100,
      Math.round(totalScore * 100) / 100,
      JSON.stringify(detailedResults),
      evaluatorId
    ],
    function(err) {
      if (err) {
        return callback(err);
      }

      // 지원자 상태 업데이트
      db.run(
        'UPDATE users SET status = "evaluated", updated_at = datetime("now") WHERE id = ?',
        [session.candidate_id],
        (updateErr) => {
          if (updateErr) {
            console.error('지원자 상태 업데이트 오류:', updateErr);
          }

          callback(null, {
            id: evaluationId,
            candidateId: session.candidate_id,
            testSessionId: session.id,
            technicalScore: Math.round(technicalPercent * 100) / 100,
            personalityScore: Math.round(personalityPercent * 100) / 100,
            problemSolvingScore: Math.round(problemSolvingPercent * 100) / 100,
            totalScore: Math.round(totalScore * 100) / 100,
            status: 'completed'
          });
        }
      );
    }
  );
}

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

module.exports = router; 