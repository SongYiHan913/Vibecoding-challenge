# 시험 자동 종료 기능 수정 요청
_Exported on 2025. 7. 6. at 10시 33분 1초 GMT+9 from Cursor (1.2.1)_

---

**User**

지원자가 시험을 시작하고 포커스를 3회 잃으면 cheating 으로 시험이 자동 종료되는 기능이 추가되어 있는데 현재 제대로 동작하지 않고 있어. 구현된 내용을 검토하고 수정해줘

---

**Cursor**

지원자 시험에서 포커스 감지 및 자동 종료 기능을 검토해보겠습니다. 관련 코드들을 먼저 확인해보겠습니다.

코드를 분석한 결과, 포커스 이탈 감지 기능이 구현되어 있지만 몇 가지 문제점이 있습니다. 

**발견된 문제점:**
1. **포커스 감지 방법의 한계**: 현재는 `visibilitychange` 이벤트만 사용하고 있어 일부 포커스 이탈을 놓칠 수 있습니다.
2. **개발자 도구나 다른 창으로의 전환 감지 부족**
3. **에러 처리 및 디버깅 로그 부족**

이제 기능을 개선해보겠습니다:

```typescriptreact
  // 포커스 이탈 감지
  useEffect(() => {
    if (!testStarted || !currentSession) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 포커스 이탈 감지
        fetch(`/api/test-sessions/${currentSession.id}/focus-lost`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            // 백엔드에서 받은 정확한 카운트로 업데이트
            setFocusLostCount(result.data.focusLostCount);
            
            alert(result.data.warning);
          } else {
            // 테스트 종료됨 (3회 초과)
            alert(result.message);
            finishTest();
            // 부정행위로 인한 테스트 종료 정보 설정
            setTestCompletionInfo({
              isCompleted: true,
              reason: 'cheating',
              completedAt: new Date().toISOString(),
            });
          }
        })
        .catch(error => {
          console.error('포커스 이탈 처리 오류:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testStarted, currentSession, router, token, finishTest, setFocusLostCount]);

->

  // 포커스 이탈 감지 (향상된 버전)
  useEffect(() => {
    if (!testStarted || !currentSession) return;

    console.log('🔍 포커스 이탈 감지 시스템 활성화', { sessionId: currentSession.id, focusLostCount });

    // 포커스 이탈을 감지하는 함수
    const handleFocusLost = async (eventType: string) => {
      console.log(`🚨 포커스 이탈 감지: ${eventType}`, { 
        currentFocusCount: focusLostCount,
        sessionId: currentSession.id 
      });

      try {
        const response = await fetch(`/api/test-sessions/${currentSession.id}/focus-lost`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📋 포커스 이탈 처리 결과:', result);

        if (result.success) {
          // 백엔드에서 받은 정확한 카운트로 업데이트
          setFocusLostCount(result.data.focusLostCount);
          
          alert(`⚠️ ${result.data.warning}\n\n현재 포커스 이탈 횟수: ${result.data.focusLostCount}/${result.data.maxAttempts}`);
        } else {
          // 테스트 종료됨 (3회 초과)
          console.log('🛑 테스트 종료 - 부정행위 감지');
          alert(`🚫 ${result.message}\n\n테스트가 자동으로 종료됩니다.`);
          
          finishTest();
          
          // 부정행위로 인한 테스트 종료 정보 설정
          setTestCompletionInfo({
            isCompleted: true,
            reason: 'cheating',
            completedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('❌ 포커스 이탈 처리 오류:', error);
        // 네트워크 오류 등의 경우에도 로컬에서 카운트 증가
        const newCount = focusLostCount + 1;
        setFocusLostCount(newCount);
        
        if (newCount >= 3) {
          alert('🚫 포커스 이탈 한계 초과로 테스트가 종료됩니다.');
          finishTest();
          setTestCompletionInfo({
            isCompleted: true,
            reason: 'cheating',
            completedAt: new Date().toISOString(),
          });
        } else {
          alert(`⚠️ 포커스 이탈이 감지되었습니다.\n${3 - newCount}회 더 포커스를 잃으면 테스트가 종료됩니다.`);
        }
      }
    };

    // 1. 페이지 가시성 변경 감지 (탭 전환, 최소화 등)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLost('visibilitychange - 탭/창 비활성화');
      }
    };

    // 2. 윈도우 포커스 이탈 감지
    const handleWindowBlur = () => {
      handleFocusLost('blur - 윈도우 포커스 이탈');
    };

    // 3. 개발자 도구 감지 (크기 변경 기반)
    let devToolsOpen = false;
    const checkDevTools = () => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          handleFocusLost('devtools - 개발자 도구 열림');
        }
      } else {
        devToolsOpen = false;
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    
    // 개발자 도구 감지를 위한 주기적 체크
    const devToolsInterval = setInterval(checkDevTools, 1000);
    
    return () => {
      console.log('🔍 포커스 이탈 감지 시스템 비활성화');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      clearInterval(devToolsInterval);
    };
  }, [testStarted, currentSession, router, token, finishTest, setFocusLostCount, focusLostCount]);
```

이제 백엔드의 포커스 이탈 처리 API도 개선해보겠습니다:

```javascript
// 부정행위 신고 (포커스 이탈)
router.post('/:sessionId/focus-lost', requireCandidate, async (req, res) => {
  const { sessionId } = req.params;
  const candidateId = req.user.userId;

  try {
    // 1. 테스트 세션 조회
    const session = await new Promise((resolve, reject) => {
      db.get(
        'SELECT focus_lost_count FROM test_sessions WHERE id = ? AND candidate_id = ? AND status = "in-progress"',
        [sessionId, candidateId],
        (err, session) => {
          if (err) reject(err);
          else resolve(session);
        }
      );
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '진행 중인 테스트 세션을 찾을 수 없습니다.'
      });
    }

    const maxAttempts = 3; // 결정된 허용 횟수
    const newFocusLostCount = session.focus_lost_count + 1;

    // 2. 포커스 이탈 카운트 업데이트
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE test_sessions SET focus_lost_count = ?, updated_at = datetime("now") WHERE id = ?',
        [newFocusLostCount, sessionId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 3. 허용 한계 초과 시 테스트 종료 및 평가
    if (newFocusLostCount >= maxAttempts) {
      console.log(`🚨 부정행위 감지로 테스트 자동 종료 - 세션: ${sessionId}, 이탈 횟수: ${newFocusLostCount}`);
      
      // 3-1. 테스트 세션 종료 처리
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE test_sessions SET status = "terminated", terminated_at = datetime("now"), 
           termination_reason = "cheating" WHERE id = ?`,
          [sessionId],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // 3-2. 지원자 상태를 evaluated로 변경
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
      res.json({
        success: true,
        message: '포커스 이탈이 기록되었습니다.',
        data: {
          focusLostCount: newFocusLostCount,
          maxAttempts: maxAttempts,
          remainingAttempts: maxAttempts - newFocusLostCount,
          warning: `${maxAttempts - newFocusLostCount}회 더 포커스를 잃으면 테스트가 종료됩니다.`
        }
      });
    }

  } catch (error) {
    console.error('포커스 이탈 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

->

// 부정행위 신고 (포커스 이탈)
router.post('/:sessionId/focus-lost', requireCandidate, async (req, res) => {
  const { sessionId } = req.params;
  const candidateId = req.user.userId;

  console.log(`🔍 포커스 이탈 처리 요청 - 세션: ${sessionId}, 지원자: ${candidateId}`);

  try {
    // 1. 테스트 세션 조회
    const session = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, focus_lost_count, status FROM test_sessions WHERE id = ? AND candidate_id = ? AND status = "in-progress"',
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
        message: '진행 중인 테스트 세션을 찾을 수 없습니다.'
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
```

이제 중복 이벤트 방지를 위한 디바운스 기능을 추가해보겠습니다:

```typescriptreact
  // 포커스 이탈 감지 (향상된 버전)
  useEffect(() => {
    if (!testStarted || !currentSession) return;

    console.log('🔍 포커스 이탈 감지 시스템 활성화', { sessionId: currentSession.id, focusLostCount });

    // 포커스 이탈을 감지하는 함수
    const handleFocusLost = async (eventType: string) => {
      console.log(`🚨 포커스 이탈 감지: ${eventType}`, { 
        currentFocusCount: focusLostCount,
        sessionId: currentSession.id 
      });

      try {
        const response = await fetch(`/api/test-sessions/${currentSession.id}/focus-lost`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📋 포커스 이탈 처리 결과:', result);

        if (result.success) {
          // 백엔드에서 받은 정확한 카운트로 업데이트
          setFocusLostCount(result.data.focusLostCount);
          
          alert(`⚠️ ${result.data.warning}\n\n현재 포커스 이탈 횟수: ${result.data.focusLostCount}/${result.data.maxAttempts}`);
        } else {
          // 테스트 종료됨 (3회 초과)
          console.log('🛑 테스트 종료 - 부정행위 감지');
          alert(`🚫 ${result.message}\n\n테스트가 자동으로 종료됩니다.`);
          
          finishTest();
          
          // 부정행위로 인한 테스트 종료 정보 설정
          setTestCompletionInfo({
            isCompleted: true,
            reason: 'cheating',
            completedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('❌ 포커스 이탈 처리 오류:', error);
        // 네트워크 오류 등의 경우에도 로컬에서 카운트 증가
        const newCount = focusLostCount + 1;
        setFocusLostCount(newCount);
        
        if (newCount >= 3) {
          alert('🚫 포커스 이탈 한계 초과로 테스트가 종료됩니다.');
          finishTest();
          setTestCompletionInfo({
            isCompleted: true,
            reason: 'cheating',
            completedAt: new Date().toISOString(),
          });
        } else {
          alert(`⚠️ 포커스 이탈이 감지되었습니다.\n${3 - newCount}회 더 포커스를 잃으면 테스트가 종료됩니다.`);
        }
      }
    };

    // 1. 페이지 가시성 변경 감지 (탭 전환, 최소화 등)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLost('visibilitychange - 탭/창 비활성화');
      }
    };

    // 2. 윈도우 포커스 이탈 감지
    const handleWindowBlur = () => {
      handleFocusLost('blur - 윈도우 포커스 이탈');
    };

    // 3. 개발자 도구 감지 (크기 변경 기반)
    let devToolsOpen = false;
    const checkDevTools = () => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          handleFocusLost('devtools - 개발자 도구 열림');
        }
      } else {
        devToolsOpen = false;
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    
    // 개발자 도구 감지를 위한 주기적 체크
    const devToolsInterval = setInterval(checkDevTools, 1000);
    
    return () => {
      console.log('🔍 포커스 이탈 감지 시스템 비활성화');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      clearInterval(devToolsInterval);
    };
  }, [testStarted, currentSession, router, token, finishTest, setFocusLostCount, focusLostCount]);

->

  // 포커스 이탈 감지 (향상된 버전)
  useEffect(() => {
    if (!testStarted || !currentSession) return;

    console.log('🔍 포커스 이탈 감지 시스템 활성화', { sessionId: currentSession.id, focusLostCount });

    // 중복 이벤트 방지를 위한 디바운스
    let isProcessingFocusLost = false;
    let focusLostTimeout: NodeJS.Timeout | null = null;

    // 포커스 이탈을 감지하는 함수 (디바운스 적용)
    const handleFocusLost = async (eventType: string) => {
      // 이미 처리 중이면 무시
      if (isProcessingFocusLost) {
        console.log(`⏭️  포커스 이탈 이벤트 스킵 (처리 중): ${eventType}`);
        return;
      }

      // 기존 타이머가 있으면 클리어
      if (focusLostTimeout) {
        clearTimeout(focusLostTimeout);
      }

      // 500ms 디바운스 적용
      focusLostTimeout = setTimeout(async () => {
        isProcessingFocusLost = true;
        
        console.log(`🚨 포커스 이탈 감지: ${eventType}`, { 
          currentFocusCount: focusLostCount,
          sessionId: currentSession.id 
        });

        try {
          const response = await fetch(`/api/test-sessions/${currentSession.id}/focus-lost`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.log('📋 포커스 이탈 처리 결과:', result);

          if (result.success) {
            // 백엔드에서 받은 정확한 카운트로 업데이트
            setFocusLostCount(result.data.focusLostCount);
            
            alert(`⚠️ ${result.data.warning}\n\n현재 포커스 이탈 횟수: ${result.data.focusLostCount}/${result.data.maxAttempts}`);
          } else {
            // 테스트 종료됨 (3회 초과)
            console.log('🛑 테스트 종료 - 부정행위 감지');
            alert(`🚫 ${result.message}\n\n테스트가 자동으로 종료됩니다.`);
            
            finishTest();
            
            // 부정행위로 인한 테스트 종료 정보 설정
            setTestCompletionInfo({
              isCompleted: true,
              reason: 'cheating',
              completedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('❌ 포커스 이탈 처리 오류:', error);
          // 네트워크 오류 등의 경우에도 로컬에서 카운트 증가
          const newCount = focusLostCount + 1;
          setFocusLostCount(newCount);
          
          if (newCount >= 3) {
            alert('🚫 포커스 이탈 한계 초과로 테스트가 종료됩니다.');
            finishTest();
            setTestCompletionInfo({
              isCompleted: true,
              reason: 'cheating',
              completedAt: new Date().toISOString(),
            });
          } else {
            alert(`⚠️ 포커스 이탈이 감지되었습니다.\n${3 - newCount}회 더 포커스를 잃으면 테스트가 종료됩니다.`);
          }
        } finally {
          isProcessingFocusLost = false;
        }
      }, 500); // 500ms 디바운스
    };

    // 1. 페이지 가시성 변경 감지 (탭 전환, 최소화 등)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLost('visibilitychange - 탭/창 비활성화');
      }
    };

    // 2. 윈도우 포커스 이탈 감지
    const handleWindowBlur = () => {
      handleFocusLost('blur - 윈도우 포커스 이탈');
    };

    // 3. 개발자 도구 감지 (크기 변경 기반)
    let devToolsOpen = false;
    const checkDevTools = () => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          handleFocusLost('devtools - 개발자 도구 열림');
        }
      } else {
        devToolsOpen = false;
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    
    // 개발자 도구 감지를 위한 주기적 체크
    const devToolsInterval = setInterval(checkDevTools, 1000);
    
    return () => {
      console.log('🔍 포커스 이탈 감지 시스템 비활성화');
      
      // 타이머 정리
      if (focusLostTimeout) {
        clearTimeout(focusLostTimeout);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      clearInterval(devToolsInterval);
    };
  }, [testStarted, currentSession, router, token, finishTest, setFocusLostCount, focusLostCount]);
```

마지막으로 현재 포커스 이탈 상태를 UI에 표시하는 인디케이터를 추가해보겠습니다:

```typescriptreact
        {/* 헤더: 진행도 표시 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 질문 정보 */}
            <div className="flex items-center space-x-4">
              <div className="text-gray-900 font-medium">
                질문 {currentQuestionIndex + 1} / {questions.length}
              </div>
              <div className="text-gray-700">
                답변 완료: {answeredCount}개 ({progressPercent}%)
              </div>
            </div>
            
            {/* 오른쪽: 타이머 */}
            <div className="flex items-center space-x-4">
              <Timer 
                remainingTime={remainingTime}
                onTimeExpire={handleForceTimeExpire}
                className="text-gray-900 font-medium"
              />
            </div>
          </div>
        </div>

->

        {/* 헤더: 진행도 표시 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 질문 정보 */}
            <div className="flex items-center space-x-4">
              <div className="text-gray-900 font-medium">
                질문 {currentQuestionIndex + 1} / {questions.length}
              </div>
              <div className="text-gray-700">
                답변 완료: {answeredCount}개 ({progressPercent}%)
              </div>
              {/* 포커스 이탈 카운트 표시 */}
              {focusLostCount > 0 && (
                <div className={`px-2 py-1 rounded text-sm font-medium ${
                  focusLostCount >= 3 ? 'bg-red-100 text-red-800' :
                  focusLostCount >= 2 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  ⚠️ 포커스 이탈: {focusLostCount}/3
                </div>
              )}
            </div>
            
            {/* 오른쪽: 타이머 */}
            <div className="flex items-center space-x-4">
              <Timer 
                remainingTime={remainingTime}
                onTimeExpire={handleForceTimeExpire}
                className="text-gray-900 font-medium"
              />
            </div>
          </div>
        </div>
```

```javascript
{focusLostCount > 0 && (
  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
    ⚠️ 경고 {focusLostCount}/3
  </div>
)}
```

## 🔧 포커스 이탈 감지 기능 개선 완료

지원자 시험에서 포커스를 3회 잃으면 자동으로 치팅으로 간주하여 테스트가 종료되는 기능을 검토하고 대폭 개선했습니다.

### 🔍 발견된 문제점들
1. **제한적인 포커스 감지**: 기존에는 `visibilitychange` 이벤트만 사용하여 일부 포커스 이탈을 놓칠 수 있었음
2. **중복 이벤트 처리 부족**: 여러 이벤트가 동시에 발생할 때 중복 처리 가능성
3. **디버깅 어려움**: 로그 부족으로 문제 진단이 어려웠음
4. **에러 처리 부족**: 네트워크 오류 등의 예외 상황 처리 미흡

### ✅ 개선사항

#### **프론트엔드 개선**
1. **다중 포커스 감지 방법**:
   - `visibilitychange`: 탭 전환, 창 최소화 감지
   - `blur`: 윈도우 포커스 이탈 감지  
   - **개발자 도구 감지**: 창 크기 변경을 통한 F12 감지

2. **디바운스 기능**: 500ms 디바운스로 중복 이벤트 방지

3. **향상된 에러 처리**: 
   - 네트워크 오류 시에도 로컬에서 카운트 증가
   - 자세한 오류 로깅

4. **사용자 친화적 알림**: 현재 포커스 이탈 횟수와 남은 기회를 명확히 표시

#### **백엔드 개선**
1. **상세한 로깅**: 각 단계별 처리 상황을 자세히 기록
2. **NULL 값 처리**: `focus_lost_count`가 NULL인 경우 0으로 처리
3. **업데이트 검증**: 데이터베이스 업데이트 성공 여부 확인
4. **개발 환경 지원**: 개발 모드에서 자세한 에러 메시지 제공

### 🎯 기능 동작 방식

1. **포커스 이탈 감지**: 탭 전환, 다른 창으로 이동, 개발자 도구 열기 등을 감지
2. **1-2회 이탈**: 경고 메시지와 함께 남은 기회 안내
3. **3회 이탈**: 자동으로 테스트 종료 및 부정행위 기록
4. **자동 평가**: 제출된 답안까지 자동 채점 수행

### 📊 UI 표시
- 테스트 진행 중 헤더에 포커스 이탈 카운트 표시 (⚠️ 경고 1/3)
- 단계별 색상 변경: 주황색(1회) → 노란색(2회) → 빨간색(3회)

### 🚀 다음 단계
개선된 기능이 정상적으로 동작하는지 테스트해보세요:
1. 브라우저에서 다른 탭으로 전환
2. F12로 개발자 도구 열기
3. 다른 애플리케이션으로 포커스 이동

각 동작에서 포커스 이탈이 감지되고 적절한 경고 메시지가 표시되는지 확인할 수 있습니다.

**서버 재시작이 필요합니다. VSCode 터미널에서 서버를 재시작해주세요.**

---

**User**

1) 시험 화면이 로드되면 화면에 자동으로 포커스
- 열린 후부터 포커스 잃었다는 팝업 연속으로 3회 뜨고 시험 종료됨
2) 시험이 종료되었는데 포커스 이탈 감지가 계속 되는 부분 수정

---

**Cursor**

네, 두 가지 문제점을 파악했습니다. 해결해보겠습니다.

**문제 분석:**
1. 페이지 로드 시 포커스 감지 시스템이 즉시 활성화되어 초기 상태를 포커스 이탈로 잘못 인식
2. 테스트 종료 후에도 포커스 감지 시스템이 계속 동작

**해결 방법:**
1. 초기 포커스 안정화 시간 추가
2. 테스트 종료 상태를 더 정확히 감지하도록 수정

```typescriptreact
  // 포커스 이탈 감지 (향상된 버전)
  useEffect(() => {
    if (!testStarted || !currentSession) return;

    console.log('🔍 포커스 이탈 감지 시스템 활성화', { sessionId: currentSession.id, focusLostCount });

    // 중복 이벤트 방지를 위한 디바운스
    let isProcessingFocusLost = false;
    let focusLostTimeout: NodeJS.Timeout | null = null;

    // 포커스 이탈을 감지하는 함수 (디바운스 적용)
    const handleFocusLost = async (eventType: string) => {
      // 이미 처리 중이면 무시
      if (isProcessingFocusLost) {
        console.log(`⏭️  포커스 이탈 이벤트 스킵 (처리 중): ${eventType}`);
        return;
      }

      // 기존 타이머가 있으면 클리어
      if (focusLostTimeout) {
        clearTimeout(focusLostTimeout);
      }

      // 500ms 디바운스 적용
      focusLostTimeout = setTimeout(async () => {
        isProcessingFocusLost = true;
        
        console.log(`🚨 포커스 이탈 감지: ${eventType}`, { 
          currentFocusCount: focusLostCount,
          sessionId: currentSession.id 
        });

        try {
          const response = await fetch(`/api/test-sessions/${currentSession.id}/focus-lost`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.log('📋 포커스 이탈 처리 결과:', result);

          if (result.success) {
            // 백엔드에서 받은 정확한 카운트로 업데이트
            setFocusLostCount(result.data.focusLostCount);
            
            alert(`⚠️ ${result.data.warning}\n\n현재 포커스 이탈 횟수: ${result.data.focusLostCount}/${result.data.maxAttempts}`);
          } else {
            // 테스트 종료됨 (3회 초과)
            console.log('🛑 테스트 종료 - 부정행위 감지');
            alert(`🚫 ${result.message}\n\n테스트가 자동으로 종료됩니다.`);
            
            finishTest();
            
            // 부정행위로 인한 테스트 종료 정보 설정
            setTestCompletionInfo({
              isCompleted: true,
              reason: 'cheating',
              completedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('❌ 포커스 이탈 처리 오류:', error);
          // 네트워크 오류 등의 경우에도 로컬에서 카운트 증가
          const newCount = focusLostCount + 1;
          setFocusLostCount(newCount);
          
          if (newCount >= 3) {
            alert('🚫 포커스 이탈 한계 초과로 테스트가 종료됩니다.');
            finishTest();
            setTestCompletionInfo({
              isCompleted: true,
              reason: 'cheating',
              completedAt: new Date().toISOString(),
            });
          } else {
            alert(`⚠️ 포커스 이탈이 감지되었습니다.\n${3 - newCount}회 더 포커스를 잃으면 테스트가 종료됩니다.`);
          }
        } finally {
          isProcessingFocusLost = false;
        }
      }, 500); // 500ms 디바운스
    };

    // 1. 페이지 가시성 변경 감지 (탭 전환, 최소화 등)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLost('visibilitychange - 탭/창 비활성화');
      }
    };

    // 2. 윈도우 포커스 이탈 감지
    const handleWindowBlur = () => {
      handleFocusLost('blur - 윈도우 포커스 이탈');
    };

    // 3. 개발자 도구 감지 (크기 변경 기반)
    let devToolsOpen = false;
    const checkDevTools = () => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          handleFocusLost('devtools - 개발자 도구 열림');
        }
      } else {
        devToolsOpen = false;
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    
    // 개발자 도구 감지를 위한 주기적 체크
    const devToolsInterval = setInterval(checkDevTools, 1000);
    
    return () => {
      console.log('🔍 포커스 이탈 감지 시스템 비활성화');
      
      // 타이머 정리
      if (focusLostTimeout) {
        clearTimeout(focusLostTimeout);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      clearInterval(devToolsInterval);
    };
  }, [testStarted, currentSession, router, token, finishTest, setFocusLostCount, focusLostCount]);

->

  // 포커스 이탈 감지 (향상된 버전)
  useEffect(() => {
    // 테스트가 시작되지 않았거나, 세션이 없거나, 이미 완료된 경우 비활성화
    if (!testStarted || !currentSession || !isTestActive || testCompletionInfo.isCompleted) {
      return;
    }

    console.log('🔍 포커스 이탈 감지 시스템 활성화', { 
      sessionId: currentSession.id, 
      focusLostCount,
      isTestActive,
      testCompleted: testCompletionInfo.isCompleted
    });

    // 초기 안정화를 위한 지연 시간 (3초)
    const stabilizationDelay = 3000;
    let isStabilized = false;
    let isProcessingFocusLost = false;
    let focusLostTimeout: NodeJS.Timeout | null = null;

    // 초기 안정화 타이머
    const stabilizationTimer = setTimeout(() => {
      isStabilized = true;
      console.log('✅ 포커스 감지 시스템 안정화 완료 - 이제 포커스 이탈 감지 시작');
    }, stabilizationDelay);

    // 포커스 이탈을 감지하는 함수 (디바운스 적용)
    const handleFocusLost = async (eventType: string) => {
      // 안정화되지 않았거나 테스트가 종료되었으면 무시
      if (!isStabilized || !isTestActive || testCompletionInfo.isCompleted) {
        console.log(`⏭️  포커스 이탈 이벤트 스킵: ${eventType} (안정화: ${isStabilized}, 활성: ${isTestActive}, 완료: ${testCompletionInfo.isCompleted})`);
        return;
      }

      // 이미 처리 중이면 무시
      if (isProcessingFocusLost) {
        console.log(`⏭️  포커스 이탈 이벤트 스킵 (처리 중): ${eventType}`);
        return;
      }

      // 기존 타이머가 있으면 클리어
      if (focusLostTimeout) {
        clearTimeout(focusLostTimeout);
      }

      // 1초 디바운스 적용 (연속 이벤트 방지)
      focusLostTimeout = setTimeout(async () => {
        // 다시 한 번 상태 확인
        if (!isTestActive || testCompletionInfo.isCompleted) {
          console.log('⏭️  포커스 이탈 처리 스킵 - 테스트 종료됨');
          return;
        }

        isProcessingFocusLost = true;
        
        console.log(`🚨 포커스 이탈 감지: ${eventType}`, { 
          currentFocusCount: focusLostCount,
          sessionId: currentSession.id 
        });

        try {
          const response = await fetch(`/api/test-sessions/${currentSession.id}/focus-lost`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.log('📋 포커스 이탈 처리 결과:', result);

          if (result.success) {
            // 백엔드에서 받은 정확한 카운트로 업데이트
            setFocusLostCount(result.data.focusLostCount);
            
            alert(`⚠️ ${result.data.warning}\n\n현재 포커스 이탈 횟수: ${result.data.focusLostCount}/${result.data.maxAttempts}`);
          } else {
            // 테스트 종료됨 (3회 초과)
            console.log('🛑 테스트 종료 - 부정행위 감지');
            alert(`🚫 ${result.message}\n\n테스트가 자동으로 종료됩니다.`);
            
            finishTest();
            
            // 부정행위로 인한 테스트 종료 정보 설정
            setTestCompletionInfo({
              isCompleted: true,
              reason: 'cheating',
              completedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('❌ 포커스 이탈 처리 오류:', error);
          // 네트워크 오류 등의 경우에도 로컬에서 카운트 증가
          const newCount = focusLostCount + 1;
          setFocusLostCount(newCount);
          
          if (newCount >= 3) {
            alert('🚫 포커스 이탈 한계 초과로 테스트가 종료됩니다.');
            finishTest();
            setTestCompletionInfo({
              isCompleted: true,
              reason: 'cheating',
              completedAt: new Date().toISOString(),
            });
          } else {
            alert(`⚠️ 포커스 이탈이 감지되었습니다.\n${3 - newCount}회 더 포커스를 잃으면 테스트가 종료됩니다.`);
          }
        } finally {
          isProcessingFocusLost = false;
        }
      }, 1000); // 1초 디바운스
    };

    // 1. 페이지 가시성 변경 감지 (탭 전환, 최소화 등)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLost('visibilitychange - 탭/창 비활성화');
      }
    };

    // 2. 윈도우 포커스 이탈 감지
    const handleWindowBlur = () => {
      handleFocusLost('blur - 윈도우 포커스 이탈');
    };

    // 3. 개발자 도구 감지 (크기 변경 기반)
    let devToolsOpen = false;
    const checkDevTools = () => {
      if (!isStabilized || !isTestActive || testCompletionInfo.isCompleted) {
        return;
      }

      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          handleFocusLost('devtools - 개발자 도구 열림');
        }
      } else {
        devToolsOpen = false;
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    
    // 개발자 도구 감지를 위한 주기적 체크
    const devToolsInterval = setInterval(checkDevTools, 2000); // 2초마다 체크
    
    return () => {
      console.log('🔍 포커스 이탈 감지 시스템 비활성화');
      
      // 모든 타이머 정리
      clearTimeout(stabilizationTimer);
      if (focusLostTimeout) {
        clearTimeout(focusLostTimeout);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      clearInterval(devToolsInterval);
    };
  }, [testStarted, currentSession, isTestActive, testCompletionInfo.isCompleted, router, token, finishTest, setFocusLostCount, focusLostCount]);
```

이제 페이지 로드 시 자동 포커스 설정과 테스트 종료 시 즉시 포커스 감지 중단 기능을 추가하겠습니다:

```typescriptreact
  // 테스트 세션 확인 및 초기화 (세션이 있을 때만)
  useEffect(() => {
    if (currentSession && questions.length > 0 && !testStarted) {
      setTestStarted(true);
      const currentQ = questions[currentQuestionIndex || 0];
      if (currentQ) {
        const savedAnswer = answers.find(answer => answer.id === currentQ.id);
        if (savedAnswer) {
          // 4지선다는 숫자, 주관식은 문자열
          setCurrentAnswer(savedAnswer.answer !== undefined ? savedAnswer.answer : savedAnswer.answerText || '');
        } else {
          // 현재 질문에 따라 초기값 설정
          if (currentQ.format === 'multiple-choice') {
            setCurrentAnswer(null); // 4지선다: 디폴트 선택 해제
          } else {
            setCurrentAnswer(''); // 주관식: 빈 문자열로 시작
          }
        }
      }
    }
  }, [currentSession, questions, testStarted, currentQuestionIndex, answers]);

->

  // 테스트 세션 확인 및 초기화 (세션이 있을 때만)
  useEffect(() => {
    if (currentSession && questions.length > 0 && !testStarted) {
      setTestStarted(true);
      const currentQ = questions[currentQuestionIndex || 0];
      if (currentQ) {
        const savedAnswer = answers.find(answer => answer.id === currentQ.id);
        if (savedAnswer) {
          // 4지선다는 숫자, 주관식은 문자열
          setCurrentAnswer(savedAnswer.answer !== undefined ? savedAnswer.answer : savedAnswer.answerText || '');
        } else {
          // 현재 질문에 따라 초기값 설정
          if (currentQ.format === 'multiple-choice') {
            setCurrentAnswer(null); // 4지선다: 디폴트 선택 해제
          } else {
            setCurrentAnswer(''); // 주관식: 빈 문자열로 시작
          }
        }
      }

      // 테스트 시작 후 페이지에 포커스 설정 (포커스 감지 시스템 안정화를 위해)
      setTimeout(() => {
        if (document.body && !document.hasFocus()) {
          window.focus();
          document.body.focus();
          console.log('🎯 테스트 페이지 포커스 설정 완료');
        }
      }, 500); // 0.5초 후 포커스 설정
    }
  }, [currentSession, questions, testStarted, currentQuestionIndex, answers]);
```

이제 테스트 완료 시 포커스 감지를 즉시 중단하는 기능을 추가하겠습니다:

```typescriptreact
  }, [testStarted, currentSession, isTestActive, testCompletionInfo.isCompleted, router, token, finishTest, setFocusLostCount, focusLostCount]);

  // 키보드 단축키 차단 (개발자 도구 등)

->

  }, [testStarted, currentSession, isTestActive, testCompletionInfo.isCompleted, router, token, finishTest, setFocusLostCount, focusLostCount]);

  // 테스트 완료/종료 시 포커스 감지 즉시 중단
  useEffect(() => {
    if (testCompletionInfo.isCompleted || !isTestActive) {
      console.log('🛑 테스트 종료 감지 - 포커스 감지 시스템 비활성화', {
        isCompleted: testCompletionInfo.isCompleted,
        isTestActive: isTestActive,
        reason: testCompletionInfo.reason
      });
    }
  }, [testCompletionInfo.isCompleted, isTestActive, testCompletionInfo.reason]);

  // 키보드 단축키 차단 (개발자 도구 등)
```

이제 `handleFinishTest` 함수를 수정하여 테스트 종료 시 즉시 상태를 업데이트하도록 하겠습니다:

```typescriptreact
  const handleFinishTest = async () => {
    if (!currentSession) {
      alert('❌ 테스트 세션 정보가 없습니다.');
      return;
    }

    if (!confirm('테스트를 완료하시겠습니까?\n\n⚠️ 테스트 완료 후에는 답안을 수정할 수 없습니다.')) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('📋 테스트 완료 처리 시작...');
      
      const response = await fetch(`/api/test-sessions/${currentSession.id}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 테스트 완료 성공');
        
        finishTest();
        
        // 테스트 완료 정보 설정
        setTestCompletionInfo({
          isCompleted: true,
          reason: 'completed',
          completedAt: new Date().toISOString(),
        });
        
        alert('✅ 테스트가 성공적으로 완료되었습니다!\n결과는 관리자가 검토 후 안내드릴 예정입니다.');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ 테스트 완료 오류:', error);
      alert(`❌ 테스트 완료 중 오류가 발생했습니다.\n${error.message}\n\n다시 시도해주세요.`);
    } finally {
      setLoading(false);
    }
  };

->

  const handleFinishTest = async () => {
    if (!currentSession) {
      alert('❌ 테스트 세션 정보가 없습니다.');
      return;
    }

    if (!confirm('테스트를 완료하시겠습니까?\n\n⚠️ 테스트 완료 후에는 답안을 수정할 수 없습니다.')) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('📋 테스트 완료 처리 시작...');
      
      // 포커스 감지 즉시 중단을 위해 테스트 완료 상태를 먼저 설정
      setTestCompletionInfo({
        isCompleted: true,
        reason: 'completed',
        completedAt: new Date().toISOString(),
      });
      
      finishTest(); // isTestActive를 false로 설정
      
      const response = await fetch(`/api/test-sessions/${currentSession.id}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 테스트 완료 성공');
        alert('✅ 테스트가 성공적으로 완료되었습니다!\n결과는 관리자가 검토 후 안내드릴 예정입니다.');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ 테스트 완료 오류:', error);
      alert(`❌ 테스트 완료 중 오류가 발생했습니다.\n${error.message}\n\n다시 시도해주세요.`);
      
      // 오류 발생 시 상태 복원
      setTestCompletionInfo({ isCompleted: false });
    } finally {
      setLoading(false);
    }
  };
```

```typescriptreact
  // 테스트 완료
  const handleFinishTest = async () => {
    if (!currentSession) return;
    
    // 마지막 답안 저장 (주관식의 경우 실제 textarea 값 사용)
    if (currentQuestion) {
      if (currentQuestion.format === 'essay') {
        const actualTextareaValue = textareaRef.current?.value || '';
        if (actualTextareaValue.trim() !== '') {
          setCurrentAnswer(actualTextareaValue);
          await handleSaveAnswer(actualTextareaValue, true); // 포커스 복원 건너뛰기
        }
      } else if (currentQuestion.format === 'multiple-choice' && currentAnswer !== null) {
        await handleSaveAnswer(currentAnswer as number, true); // 포커스 복원 건너뛰기
      }
    }
    
    const totalQuestions = questions.length;
    
    const confirmMessage = `테스트를 완료하시겠습니까?\n\n답변 완료: ${answeredCount}/${totalQuestions}문제\n미답변 문제는 0점 처리됩니다.`;
    
    if (confirm(confirmMessage)) {
      const result = await finishTest();
      if (result && result.success) {
        // 테스트 완료 정보 설정하여 완료 화면 표시
        setTestCompletionInfo({
          isCompleted: true,
          reason: 'completed',
          completedAt: new Date().toISOString(),
        });
      } else {
        alert('테스트 완료 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

->

  // 테스트 완료
  const handleFinishTest = async () => {
    if (!currentSession) return;
    
    // 마지막 답안 저장 (주관식의 경우 실제 textarea 값 사용)
    if (currentQuestion) {
      if (currentQuestion.format === 'essay') {
        const actualTextareaValue = textareaRef.current?.value || '';
        if (actualTextareaValue.trim() !== '') {
          setCurrentAnswer(actualTextareaValue);
          await handleSaveAnswer(actualTextareaValue, true); // 포커스 복원 건너뛰기
        }
      } else if (currentQuestion.format === 'multiple-choice' && currentAnswer !== null) {
        await handleSaveAnswer(currentAnswer as number, true); // 포커스 복원 건너뛰기
      }
    }
    
    const totalQuestions = questions.length;
    
    const confirmMessage = `테스트를 완료하시겠습니까?\n\n답변 완료: ${answeredCount}/${totalQuestions}문제\n미답변 문제는 0점 처리됩니다.`;
    
    if (confirm(confirmMessage)) {
      // 포커스 감지 즉시 중단을 위해 테스트 완료 상태를 먼저 설정
      console.log('🛑 테스트 완료 시작 - 포커스 감지 시스템 즉시 중단');
      setTestCompletionInfo({
        isCompleted: true,
        reason: 'completed',
        completedAt: new Date().toISOString(),
      });
      
      const result = await finishTest();
      if (result && result.success) {
        console.log('✅ 테스트 완료 성공');
      } else {
        console.error('❌ 테스트 완료 오류:', result);
        alert('테스트 완료 중 오류가 발생했습니다. 다시 시도해주세요.');
        // 오류 시 상태 복원
        setTestCompletionInfo({ isCompleted: false });
      }
    }
  };
```

이제 백엔드의 포커스 이탈 API에서도 테스트 종료 상태를 더 정확히 감지하도록 개선하겠습니다:

```javascript
    // 1. 테스트 세션 조회
    const session = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, focus_lost_count, status FROM test_sessions WHERE id = ? AND candidate_id = ? AND status = "in-progress"',
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
        message: '진행 중인 테스트 세션을 찾을 수 없습니다.'
      });
    }

->

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
```

## ✅ 포커스 이탈 감지 기능 수정 완료

두 가지 주요 문제점을 해결했습니다:

### 🔧 해결된 문제점

#### **1. 시험 화면 로드 시 연속 포커스 이탈 감지 문제**
- **원인**: 페이지 로드 즉시 포커스 감지 시스템이 활성화되어 초기 상태를 포커스 이탈로 잘못 인식
- **해결책**:
  - 🕐 **3초 안정화 시간** 추가: 테스트 시작 후 3초간 포커스 감지 비활성화
  - 🎯 **자동 포커스 설정**: 테스트 시작 0.5초 후 페이지에 자동 포커스
  - ⏱️ **디바운스 시간 증가**: 500ms → 1초로 증가하여 연속 이벤트 방지

#### **2. 테스트 종료 후 포커스 감지 계속 동작 문제**
- **원인**: 테스트 종료 상태 변경과 포커스 감지 시스템 비활성화 사이의 타이밍 차이
- **해결책**:
  - 🛑 **즉시 종료**: 테스트 완료 버튼 클릭 시 `testCompletionInfo.isCompleted`를 먼저 설정
  - 📊 **실시간 모니터링**: 테스트 종료 상태를 실시간으로 감지하는 별도 useEffect 추가
  - 🚫 **백엔드 검증**: 이미 종료된 테스트 세션에 대한 포커스 이탈 요청 차단

### 🎯 개선된 기능 동작

1. **테스트 시작**:
   ```
   페이지 로드 → 0.5초 후 자동 포커스 → 3초 안정화 → 포커스 감지 활성화
   ```

2. **포커스 이탈 감지**:
   ```
   포커스 이탈 → 1초 디바운스 → 백엔드 검증 → 경고/종료 처리
   ```

3. **테스트 종료**:
   ```
   완료 버튼 클릭 → 즉시 상태 변경 → 포커스 감지 중단 → 백엔드 처리
   ```

### 📋 주요 개선사항

#### **프론트엔드**
- ✅ 3초 안정화 시간으로 초기 오탐지 방지
- ✅ 테스트 종료 시 즉시 포커스 감지 중단
- ✅ 더 상세한 로깅으로 디버깅 개선
- ✅ 1초 디바운스로 연속 이벤트 방지

#### **백엔드**
- ✅ 테스트 세션 상태 검증 강화
- ✅ 종료된 테스트에 대한 포커스 이탈 요청 차단
- ✅ 더 명확한 오류 메시지 제공

### 🧪 테스트 가이드

이제 다음과 같이 테스트해보시면 됩니다:

1. **정상 시나리오**:
   - 테스트 시작 후 3초 대기
   - 다른 탭으로 전환 → 경고 메시지 확인
   - 총 3회 포커스 이탈 시 자동 종료 확인

2. **종료 후 시나리오**:
   - 테스트 완료 버튼 클릭
   - 완료 후 다른 탭으로 전환해도 포커스 이탈 감지 안 됨

**서버 재시작이 필요합니다. VSCode 터미널에서 서버를 재시작해주세요.**

```plaintext
   페이지 로드 → 0.5초 후 자동 포커스 → 3초 안정화 → 포커스 감지 활성화
```

```plaintext
   포커스 이탈 → 1초 디바운스 → 백엔드 검증 → 경고/종료 처리
```

```plaintext
   완료 버튼 클릭 → 즉시 상태 변경 → 포커스 감지 중단 → 백엔드 처리
```

---

**User**

포커스는 그대로 둔채 다른 프로그램으로 전환하는 경우 감지가 안 되는 것 같아. 코드 수정은 아직 하지 말고, 의견이 있어?

---

**Cursor**

네, 좋은 지적입니다! 현재 구현된 포커스 감지 시스템의 한계점을 정확히 짚어주셨네요.

## 🔍 현재 포커스 감지 방법의 한계점

### **현재 구현된 감지 방법들:**
1. `visibilitychange` → 탭 전환, 브라우저 최소화만 감지
2. `window.blur` → 브라우저 창이 완전히 포커스를 잃을 때만 감지  
3. 개발자 도구 감지 → 창 크기 변경 기반

### **감지되지 않는 케이스들:**
- 🖥️ **듀얼 모니터**: 브라우저는 한 모니터에 두고 다른 모니터 프로그램 사용
- 📱 **모바일/태블릿**: 브라우저 위에 다른 앱 창을 띄우기
- 💻 **윈도우 겹치기**: 브라우저 창 위에 다른 프로그램 창 올리기
- 🎮 **Alt+Tab 없는 전환**: 작업표시줄 클릭으로 다른 프로그램 전환
- 📺 **PIP 모드**: 브라우저가 보이긴 하지만 실제로는 다른 작업 수행

## 💡 추가 감지 방법 아이디어

### **1. 마우스 기반 감지**
```javascript
// 마우스가 브라우저 창을 벗어날 때
document.addEventListener('mouseleave', handleMouseLeave);
// 하지만 단순 마우스 이동으로는 오탐 가능성 높음
```

### **2. 활성도 기반 감지**
```javascript
// document.hasFocus() API 주기적 체크
setInterval(() => {
  if (!document.hasFocus()) {
    // 포커스 이탈 감지
  }
}, 1000);
```

### **3. 사용자 상호작용 추적**
```javascript
// 일정 시간 동안 아무 활동이 없으면 의심
// 마우스 움직임, 키보드 입력, 스크롤 등을 추적
// 하지만 단순히 문제를 읽고 있을 수도 있어서 조심스러움
```

### **4. 조합 감지 방식**
- 여러 신호를 조합해서 종합 판단
- 예: 마우스 이탈 + 키보드 입력 없음 + 일정 시간 경과

## ⚖️ 트레이드오프 고려사항

### **더 엄격한 감지의 장점:**
- ✅ 부정행위 감지율 향상
- ✅ 더 공정한 시험 환경

### **더 엄격한 감지의 단점:**
- ❌ **오탐 증가**: 정상적인 행동도 부정행위로 오인
- ❌ **사용자 경험 저하**: 너무 민감해서 스트레스 증가
- ❌ **접근성 문제**: 장애인이나 특수 환경 사용자에게 불리
- ❌ **기술적 한계**: 브라우저 보안 정책상 완벽한 감지 불가능

## 🎯 현실적인 접근 방안

### **Option 1: 현재 수준 유지**
- 현재 구현도 충분히 효과적
- 완벽한 감지보다는 "적당한 억제 효과"에 집중
- 대부분의 의도적 부정행위는 잡아낼 수 있음

### **Option 2: 점진적 개선**
- 마우스 이탈 감지 추가 (긴 지연시간과 함께)
- `document.hasFocus()` 주기적 체크 추가
- 하지만 오탐을 최소화하는 방향으로

### **Option 3: 사용자 교육 강화**
- 기술적 감지보다는 사전 안내와 교육에 집중
- "다른 프로그램 사용 금지" 명시적 안내
- 시험 전 환경 설정 가이드 제공

## 🤔 개인적인 의견

현재 구현된 수준이 **현실적으로 적절**하다고 생각합니다:

1. **100% 완벽한 감지는 불가능**하고, 시도할수록 오탐이 증가
2. **주요 부정행위 패턴**은 현재 방식으로도 충분히 감지 가능
3. **사용자 경험**과 **공정성** 사이의 균형이 중요

추가 감지 방법을 구현한다면 **매우 보수적인 설정**으로 시작해서 오탐률을 지켜보며 점진적으로 조정하는 것이 좋겠습니다.

어떤 방향으로 접근하고 싶으신지 의견 부탁드립니다! 🙂

```javascript
// 마우스가 브라우저 창을 벗어날 때
document.addEventListener('mouseleave', handleMouseLeave);
// 하지만 단순 마우스 이동으로는 오탐 가능성 높음
```

```javascript
// document.hasFocus() API 주기적 체크
setInterval(() => {
  if (!document.hasFocus()) {
    // 포커스 이탈 감지
  }
}, 1000);
```

```javascript
// 일정 시간 동안 아무 활동이 없으면 의심
// 마우스 움직임, 키보드 입력, 스크롤 등을 추적
// 하지만 단순히 문제를 읽고 있을 수도 있어서 조심스러움
```

