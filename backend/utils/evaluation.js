const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

/**
 * 테스트 세션에 대한 자동 평가 수행
 * @param {Object} session - 테스트 세션 정보
 * @param {string} evaluatorId - 평가자 ID (시스템 자동 평가인 경우 'system')
 * @returns {Promise<Object>} 평가 결과
 */
function performAutoEvaluation(session, evaluatorId = 'system') {
  return new Promise((resolve, reject) => {
    try {
      const questions = JSON.parse(session.questions);
      // answers는 배열 형태로 저장되므로 배열로 파싱
      const answersArray = JSON.parse(session.answers || '[]');
      
      // 빠른 검색을 위해 답안을 Map으로 변환
      const answersMap = {};
      answersArray.forEach(answer => {
        answersMap[answer.id] = answer;
      });
      
      console.log(`🎯 자동 채점 시작 - 세션: ${session.id}`);
      console.log(`📋 질문 수: ${questions.length}, 답안 수: ${answersArray.length}`);
      
      let technicalScore = 0;
      let personalityScore = 0;
      let problemSolvingScore = 0;
      let maxTechnicalScore = 0;
      let maxPersonalityScore = 0;
      let maxProblemSolvingScore = 0;

      const detailedResults = [];

      // 각 질문별 채점
      questions.forEach((question, index) => {
        const userAnswer = answersMap[question.id];
        let score = 0;
        let maxScore = question.points;

        if (userAnswer) {
          if (question.format === 'multiple-choice') {
            // 객관식 채점
            // userAnswer.answer는 0-based (0,1,2,3), question.correct_answer는 1-based (1,2,3,4)
            // 따라서 userAnswer.answer + 1로 변환하여 비교
            const userChoice = userAnswer.answer + 1; // 0-based를 1-based로 변환
            const correctChoice = question.correct_answer;
            
            console.log(`📝 질문 ${index + 1} (${question.id}): 지원자 선택 ${userAnswer.answer} → ${userChoice}, 정답 ${correctChoice}`);
            
            if (userChoice === correctChoice) {
              score = maxScore;
              console.log(`✅ 정답! ${score}점 획득`);
            } else {
              console.log(`❌ 오답! 0점`);
            }
          } else if (question.format === 'essay') {
            // 주관식 채점 (키워드 기반)
            if (question.required_keywords && userAnswer.answerText) {
              const keywords = Array.isArray(question.required_keywords) 
                ? question.required_keywords 
                : JSON.parse(question.required_keywords);
              const answerText = userAnswer.answerText.toLowerCase();
              const matchedKeywords = keywords.filter(keyword => 
                answerText.includes(keyword.toLowerCase())
              );
              score = Math.round((matchedKeywords.length / keywords.length) * maxScore);
              console.log(`📝 주관식 질문 ${index + 1}: 키워드 ${matchedKeywords.length}/${keywords.length} 매칭, ${score}점`);
            }
          }
        } else {
          console.log(`📝 질문 ${index + 1} (${question.id}): 답안 없음, 0점`);
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
            console.error('평가 결과 저장 오류:', err);
            return reject(err);
          }

          console.log(`✅ 자동 평가 완료 - 세션: ${session.id}, 총점: ${Math.round(totalScore * 100) / 100}%`);

          resolve({
            id: evaluationId,
            candidateId: session.candidate_id,
            testSessionId: session.id,
            technicalScore: Math.round(technicalPercent * 100) / 100,
            personalityScore: Math.round(personalityPercent * 100) / 100,
            problemSolvingScore: Math.round(problemSolvingPercent * 100) / 100,
            totalScore: Math.round(totalScore * 100) / 100,
            status: 'completed',
            detailedResults: detailedResults.length
          });
        }
      );

    } catch (error) {
      console.error('자동 평가 수행 오류:', error);
      reject(error);
    }
  });
}

/**
 * 평가 중복 체크
 * @param {string} testSessionId - 테스트 세션 ID
 * @returns {Promise<boolean>} 이미 평가되었는지 여부
 */
function checkEvaluationExists(testSessionId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM evaluations WHERE test_session_id = ?',
      [testSessionId],
      (err, evaluation) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!evaluation);
        }
      }
    );
  });
}

/**
 * 테스트 세션 완료 후 자동 평가 수행
 * @param {string} sessionId - 테스트 세션 ID
 * @param {string} candidateId - 지원자 ID
 * @param {string} evaluatorId - 평가자 ID (기본값: 'system')
 * @returns {Promise<Object>} 평가 결과
 */
async function performTestCompletionEvaluation(sessionId, candidateId, evaluatorId = 'system') {
  try {
    // 평가 중복 체크
    const exists = await checkEvaluationExists(sessionId);
    if (exists) {
      console.log(`⚠️  이미 평가된 세션입니다: ${sessionId}`);
      return {
        success: false,
        message: '이미 평가가 완료된 테스트입니다.',
        alreadyEvaluated: true
      };
    }

    // 테스트 세션 조회
    const session = await new Promise((resolve, reject) => {
      db.get(
        `SELECT ts.*, u.applied_field, u.experience 
         FROM test_sessions ts 
         JOIN users u ON ts.candidate_id = u.id 
         WHERE ts.id = ? AND ts.candidate_id = ?`,
        [sessionId, candidateId],
        (err, session) => {
          if (err) reject(err);
          else resolve(session);
        }
      );
    });

    if (!session) {
      return {
        success: false,
        message: '테스트 세션을 찾을 수 없습니다.'
      };
    }

    // 자동 평가 수행
    const evaluationResult = await performAutoEvaluation(session, evaluatorId);

    return {
      success: true,
      message: '자동 평가가 완료되었습니다.',
      evaluation: evaluationResult
    };

  } catch (error) {
    console.error('테스트 완료 평가 오류:', error);
    return {
      success: false,
      message: '평가 처리 중 오류가 발생했습니다.',
      error: error.message
    };
  }
}

module.exports = {
  performAutoEvaluation,
  checkEvaluationExists,
  performTestCompletionEvaluation
}; 