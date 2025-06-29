const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken, requireAdmin, requireCandidate } = require('../middleware/auth');

const router = express.Router();

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

// 테스트 세션 시작 (지원자)
router.post('/:sessionId/start', requireCandidate, (req, res) => {
  const { sessionId } = req.params;
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

      if (session.status !== 'not-started') {
        return res.status(400).json({
          success: false,
          message: '이미 시작되었거나 완료된 테스트입니다.'
        });
      }

      // 테스트 시작
      db.run(
        'UPDATE test_sessions SET status = "in-progress", started_at = datetime("now"), updated_at = datetime("now") WHERE id = ?',
        [sessionId],
        function(err) {
          if (err) {
            console.error('테스트 시작 오류:', err);
            return res.status(500).json({
              success: false,
              message: '테스트 시작 중 오류가 발생했습니다.'
            });
          }

          res.json({
            success: true,
            message: '테스트가 시작되었습니다.',
            data: {
              sessionId,
              status: 'in-progress',
              questions: JSON.parse(session.questions),
              remainingTime: session.remaining_time,
              totalTime: session.total_time
            }
          });
        }
      );
    }
  );
});

// 답안 제출
router.post('/:sessionId/answers', requireCandidate, (req, res) => {
  const { sessionId } = req.params;
  const { questionId, answer, answerText } = req.body;
  const candidateId = req.user.userId;

  if (!questionId || (!answer && !answerText)) {
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

      // 현재 답안들 가져오기
      const currentAnswers = session.answers ? JSON.parse(session.answers) : {};
      
      // 새 답안 추가
      currentAnswers[questionId] = {
        answer: answer || null,
        answerText: answerText || null,
        submittedAt: new Date().toISOString()
      };

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
            message: '답안이 저장되었습니다.'
          });
        }
      );
    }
  );
});

// 테스트 완료
router.post('/:sessionId/complete', requireCandidate, (req, res) => {
  const { sessionId } = req.params;
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

      // 테스트 완료
      db.run(
        'UPDATE test_sessions SET status = "completed", completed_at = datetime("now"), updated_at = datetime("now") WHERE id = ?',
        [sessionId],
        function(err) {
          if (err) {
            console.error('테스트 완료 오류:', err);
            return res.status(500).json({
              success: false,
              message: '테스트 완료 처리 중 오류가 발생했습니다.'
            });
          }

          // 지원자 상태 업데이트
          db.run(
            'UPDATE users SET status = "completed", updated_at = datetime("now") WHERE id = ?',
            [candidateId],
            (err) => {
              if (err) {
                console.error('지원자 상태 업데이트 오류:', err);
              }

              res.json({
                success: true,
                message: '테스트가 완료되었습니다.',
                data: {
                  sessionId,
                  status: 'completed',
                  completedAt: new Date()
                }
              });
            }
          );
        }
      );
    }
  );
});

// 부정행위 신고
router.post('/:sessionId/cheating', requireCandidate, (req, res) => {
  const { sessionId } = req.params;
  const { type } = req.body; // 'focus-lost', 'tab-switch', 'copy-paste' 등
  const candidateId = req.user.userId;

  db.get(
    'SELECT cheating_attempts, focus_lost_count FROM test_sessions WHERE id = ? AND candidate_id = ?',
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

      const maxAttempts = parseInt(process.env.MAX_CHEATING_ATTEMPTS) || 3;
      let newCheatingAttempts = session.cheating_attempts + 1;
      let newFocusLostCount = session.focus_lost_count;

      if (type === 'focus-lost') {
        newFocusLostCount += 1;
      }

      // 부정행위 카운트 업데이트
      db.run(
        'UPDATE test_sessions SET cheating_attempts = ?, focus_lost_count = ?, updated_at = datetime("now") WHERE id = ?',
        [newCheatingAttempts, newFocusLostCount, sessionId],
        function(err) {
          if (err) {
            console.error('부정행위 카운트 업데이트 오류:', err);
            return res.status(500).json({
              success: false,
              message: '서버 오류가 발생했습니다.'
            });
          }

          // 허용 한계 초과 시 테스트 종료
          if (newCheatingAttempts >= maxAttempts) {
            db.run(
              'UPDATE test_sessions SET status = "terminated", terminated_at = datetime("now"), termination_reason = "부정행위 의심" WHERE id = ?',
              [sessionId],
              (err) => {
                if (err) {
                  console.error('테스트 종료 오류:', err);
                }

                res.json({
                  success: false,
                  message: '부정행위가 감지되어 테스트가 종료되었습니다.',
                  data: {
                    terminated: true,
                    cheatingAttempts: newCheatingAttempts,
                    maxAttempts
                  }
                });
              }
            );
          } else {
            res.json({
              success: true,
              message: '부정행위가 기록되었습니다.',
              data: {
                cheatingAttempts: newCheatingAttempts,
                maxAttempts,
                remainingAttempts: maxAttempts - newCheatingAttempts
              }
            });
          }
        }
      );
    }
  );
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

module.exports = router; 