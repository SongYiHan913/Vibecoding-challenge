import { useEffect, useCallback } from 'react';
import { useTestStore } from '@/store/testStore';
import { useAuthStore } from '@/store/authStore';
import { testAPI } from '@/utils/api';
import { TEST_CONFIG, ERROR_MESSAGES } from '@/constants';

export const useTest = () => {
  const {
    currentSession,
    currentQuestionIndex,
    currentQuestion,
    questions,
    answers,
    remainingTime,
    isTestActive,
    focusLostCount,
    isSubmitting,
    startTest,
    setCurrentQuestion,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    pauseTest,
    resumeTest,
    finishTest,
    incrementFocusLost,
    setSubmitting,
    resetTest,
  } = useTestStore();

  const { token } = useAuthStore();

  // 테스트 시작
  const handleStartTest = async (candidateId: string): Promise<{ success: boolean; error?: string }> => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/test-sessions/start-for-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        startTest(result.data.sessionId, result.data.questions);
        return { success: true };
      } else {
        return { success: false, error: result.message || '테스트 시작 실패' };
      }
    } catch (error: any) {
      console.error('테스트 시작 오류:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    } finally {
      setSubmitting(false);
    }
  };

  // 답안 제출
  const handleSubmitAnswer = async (questionId: string, answer: string | number): Promise<{ success: boolean; error?: string }> => {
    if (!currentSession || isSubmitting) {
      return { success: false, error: '활성 세션이 없거나 이미 제출 중입니다.' };
    }

    setSubmitting(true);
    try {
      const answerData = typeof answer === 'number' 
        ? { questionId, answer } 
        : { questionId, answerText: answer };

      const response = await fetch(`/api/test-sessions/${currentSession.id}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(answerData),
      });

      const result = await response.json();

      if (result.success) {
        submitAnswer(questionId, answer);
        return { success: true };
      } else {
        return { success: false, error: result.message || '답안 저장 실패' };
      }
    } catch (error: any) {
      console.error('Submit answer error:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    } finally {
      setSubmitting(false);
    }
  };

  // 테스트 완료
  const handleFinishTest = async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentSession) {
      return { success: false, error: '활성 세션이 없습니다.' };
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/test-sessions/${currentSession.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'completed' }),
      });

      const result = await response.json();

      if (result.success) {
        finishTest();
        return { success: true };
      } else {
        return { success: false, error: result.message || '테스트 완료 실패' };
      }
    } catch (error: any) {
      console.error('테스트 완료 오류:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    } finally {
      setSubmitting(false);
    }
  };

  // 포커스 감지 및 부정행위 방지
  const handleVisibilityChange = useCallback(() => {
    if (!isTestActive) return;

    if (document.hidden) {
      // 포커스를 잃었을 때
      incrementFocusLost();
      pauseTest();

      // 허용 횟수 초과 시 테스트 종료
      if (focusLostCount >= TEST_CONFIG.MAX_CHEATING_ATTEMPTS) {
        alert(ERROR_MESSAGES.CHEATING_DETECTED);
        handleFinishTest();
        return;
      }

      alert(`부정행위 경고: 다른 창으로 이동하지 마세요. (${focusLostCount + 1}/${TEST_CONFIG.MAX_CHEATING_ATTEMPTS})`);
    } else {
      // 포커스를 되찾았을 때
      resumeTest();
    }
  }, [isTestActive, focusLostCount, incrementFocusLost, pauseTest, resumeTest]);

  // 키보드 이벤트 감지 (F12, Ctrl+Shift+I 등 차단)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isTestActive) return;

    // 개발자 도구 단축키 차단
    if (
      event.key === 'F12' ||
      (event.ctrlKey && event.shiftKey && event.key === 'I') ||
      (event.ctrlKey && event.shiftKey && event.key === 'J') ||
      (event.ctrlKey && event.key === 'U')
    ) {
      event.preventDefault();
      alert('부정행위가 감지되었습니다.');
      incrementFocusLost();
    }
  }, [isTestActive, incrementFocusLost]);

  // 우클릭 방지
  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (isTestActive) {
      event.preventDefault();
    }
  }, [isTestActive]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (isTestActive) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [isTestActive, handleVisibilityChange, handleKeyDown, handleContextMenu]);

  // 페이지 새로고침 방지
  useEffect(() => {
    if (isTestActive) {
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = '정말 페이지를 떠나시겠습니까? 진행 중인 테스트가 종료됩니다.';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isTestActive]);

  // 현재 질문의 답안 가져오기
  const getCurrentAnswer = () => {
    if (!currentQuestion) return null;
    return answers.find(answer => answer.questionId === currentQuestion.id);
  };

  // 답변한 질문 수
  const getAnsweredCount = () => {
    return answers.length;
  };

  // 진행률 계산
  const getProgress = () => {
    if (questions.length === 0) return 0;
    return Math.round((getAnsweredCount() / questions.length) * 100);
  };

  // 특정 질문으로 이동
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestion(index);
    }
  };

  return {
    // State
    currentSession,
    currentQuestionIndex,
    currentQuestion,
    questions,
    answers,
    remainingTime,
    isTestActive,
    focusLostCount,
    isSubmitting,

    // Actions
    startTest: handleStartTest,
    submitAnswer: handleSubmitAnswer,
    finishTest: handleFinishTest,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetTest,

    // Computed
    getCurrentAnswer,
    getAnsweredCount,
    getProgress,

    // Helpers
    isFirstQuestion: currentQuestionIndex === 0,
    isLastQuestion: currentQuestionIndex === questions.length - 1,
    hasAnswered: getCurrentAnswer() !== undefined,
    canSubmit: !isSubmitting && currentQuestion !== null,
  };
}; 