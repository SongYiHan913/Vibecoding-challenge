'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useTestStore } from '@/store/testStore';
import { useTest } from '@/hooks/useTest';
import { Timer } from '@/components/common/Timer';
import { Question } from '@/types';

export default function TestPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
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
    setFocusLostCount,
    resetTest,
  } = useTestStore();

  const [testCompletionInfo, setTestCompletionInfo] = useState<{
    isCompleted: boolean;
    reason?: string;
    completedAt?: string;
  }>({ isCompleted: false });

  const [candidateStatus, setCandidateStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  const {
    startTest,
    submitAnswer,
    finishTest,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    getCurrentAnswer,
    getAnsweredCount,
    getProgress,
  } = useTest();

  // 진척도 관련 값들을 메모이제이션하여 불필요한 업데이트 방지
  const answeredCount = useMemo(() => getAnsweredCount(), [answers, questions]);
  const progressPercent = useMemo(() => getProgress(), [answers, questions]);

  const [currentAnswer, setCurrentAnswer] = useState<string | number | null>(null);
  const [isAgreed, setIsAgreed] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  // 주관식 답안 텍스트박스 포커스 유지를 위한 ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 페이지 로드 시 사용자 상태 확인 (한 번만 실행)
  useEffect(() => {
    const checkUserStatus = async () => {
      // 이미 완료 정보가 있거나 필수 정보가 없으면 리턴
      if (!user?.id || !token || testCompletionInfo.isCompleted) return;

      try {
        // 지원자 본인 정보를 조회하여 상태 확인
        const response = await fetch('/api/candidates/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.success) {
            const candidate = userData.data;
            setCandidateStatus(candidate.status);
            
            // 사용자 상태가 'evaluated'인 경우 테스트 완료 정보 조회
            if (candidate.status === 'evaluated' && candidate.test_session_id) {
              // 테스트 세션 정보 조회
              const sessionResponse = await fetch(`/api/test-sessions/${candidate.test_session_id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                if (sessionData.success) {
                  setTestCompletionInfo({
                    isCompleted: true,
                    reason: sessionData.data.termination_reason || 'completed',
                    completedAt: sessionData.data.completed_at || sessionData.data.terminated_at,
                  });
                  return;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('사용자 상태 확인 오류:', error);
      }
    };

    checkUserStatus();
  }, [user, token, testCompletionInfo.isCompleted]);

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

  // 질문 변경 시 답안 로드
  useEffect(() => {
    if (currentQuestion) {
      const savedAnswer = answers.find(answer => answer.id === currentQuestion.id);
      if (savedAnswer) {
        // 4지선다는 숫자(0 포함), 주관식은 문자열
        setCurrentAnswer(savedAnswer.answer !== undefined ? savedAnswer.answer : savedAnswer.answerText || '');
      } else {
        // 저장된 답안이 없을 때: 4지선다는 null, 주관식은 빈 문자열
        if (currentQuestion.format === 'multiple-choice') {
          setCurrentAnswer(null); // 4지선다: 디폴트 선택 해제
        } else {
          setCurrentAnswer(''); // 주관식: 빈 문자열로 시작
        }
      }
    }
  }, [currentQuestionIndex, currentQuestion, answers]);

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

  // 키보드 단축키 차단 (개발자 도구 등)
  useEffect(() => {
    if (!testStarted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U 차단
      if (
        event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && event.key === 'I') ||
        (event.ctrlKey && event.shiftKey && event.key === 'J') ||
        (event.ctrlKey && event.key === 'U')
      ) {
        event.preventDefault();
        alert('해당 기능은 테스트 중에 사용할 수 없습니다.');
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [testStarted]);

  // 페이지 이탈 방지 (테스트 진행 중일 때만)
  useEffect(() => {
    // 테스트가 시작되지 않았거나 이미 완료된 경우 이벤트 리스너 등록하지 않음
    if (!testStarted || testCompletionInfo.isCompleted) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '정말 페이지를 떠나시겠습니까? 진행 중인 테스트가 종료됩니다.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [testStarted, testCompletionInfo.isCompleted]);

  // 테스트 완료 시 beforeunload 이벤트 리스너 명시적 제거
  useEffect(() => {
    if (testCompletionInfo.isCompleted) {
      // 모든 beforeunload 이벤트 리스너 제거
      const removeAllBeforeUnloadListeners = () => {
        window.onbeforeunload = null;
      };
      removeAllBeforeUnloadListeners();
    }
  }, [testCompletionInfo.isCompleted]);

  // 타이머로부터 시간 업데이트 받기 (포커스 유지를 위해 최적화)
  const handleTimeUpdate = useCallback(async (timeLeft: number) => {
    if (!currentSession) return;

    // 30초마다 서버에 시간 업데이트 (API 호출 빈도 줄이기)
    if (timeLeft % 30 === 0) {
      try {
        await fetch(`/api/test-sessions/${currentSession.id}/time`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ remainingTime: timeLeft }),
        });
      } catch (error) {
        console.error('시간 업데이트 오류:', error);
      }
    }
  }, [currentSession?.id, token]);

  // 타이머 종료 핸들러
  const handleTimeUp = useCallback(async () => {
    if (confirm('시간이 만료되었습니다. 테스트를 완료하시겠습니까?')) {
      const result = await finishTest();
      if (result && result.success) {
        // 시간 초과로 인한 테스트 완료 정보 설정
        setTestCompletionInfo({
          isCompleted: true,
          reason: 'time-expired',
          completedAt: new Date().toISOString(),
        });
      }
    }
  }, [finishTest]);

  // 테스트 시작
  const handleStartTest = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const result = await startTest(user.id);
      if (result.success) {
        setTestStarted(true);
      } else {
        alert(result.error || '테스트 시작 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('테스트 시작 오류:', error);
      alert('테스트 시작 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 답안 저장
  const handleSaveAnswer = useCallback(async (answerToSave?: string | number, skipFocusRestore?: boolean) => {
    if (!currentQuestion || !currentSession) return;
    
    const answer = answerToSave !== undefined ? answerToSave : currentAnswer;
    
    // 4지선다: null이면 저장하지 않음, 주관식: 빈 문자열이면 저장하지 않음
    if (currentQuestion.format === 'multiple-choice' && answer === null) return;
    if (currentQuestion.format === 'essay' && (!answer || answer.toString().trim() === '')) return;

    // 주관식 텍스트박스가 포커스된 상태라면 포커스 위치 저장 (질문 이동이 아닐 때만)
    const shouldRestoreFocus = !skipFocusRestore && document.activeElement === textareaRef.current;
    const cursorPosition = shouldRestoreFocus ? (textareaRef.current?.selectionStart ?? null) : null;

    setSaveStatus('saving');
    try {
      const result = await submitAnswer(currentQuestion.id, answer as string | number);
      if (result && result.success) {
        setSaveStatus('saved');
        
        // 저장 후 포커스 복원 (주관식이고 이전에 포커스되어 있었고, 질문 이동이 아닐 때만)
        if (shouldRestoreFocus && textareaRef.current && currentQuestion.format === 'essay') {
          setTimeout(() => {
            textareaRef.current?.focus();
            if (cursorPosition !== null && textareaRef.current) {
              textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
            }
          }, 0);
        }
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('답안 저장 오류:', error);
      setSaveStatus('error');
    }
  }, [currentQuestion, currentSession, submitAnswer]);

  // 주관식 답안 저장 (포커스를 잃었을 때만)
  const handleTextareaBlur = useCallback(() => {
    if (!testStarted || !currentQuestion || currentQuestion.format !== 'essay') return;
    
    // 실제 textarea 값 사용 (currentAnswer와 동기화되지 않을 수 있음)
    const actualTextareaValue = textareaRef.current?.value || '';
    if (actualTextareaValue.trim() === '') return;
    
    // currentAnswer 동기화 후 저장 (이미 blur 상태이므로 포커스 복원 불필요)
    setCurrentAnswer(actualTextareaValue);
    handleSaveAnswer(actualTextareaValue, true);
  }, [testStarted, currentQuestion, handleSaveAnswer]);

  // 질문 이동 시 저장
  const handleQuestionMove = async (direction: 'next' | 'prev' | number) => {
    // 주관식 문제인 경우, 실제 textarea의 값을 가져와서 저장
    if (currentQuestion && currentQuestion.format === 'essay') {
      const actualTextareaValue = textareaRef.current?.value || '';
      if (actualTextareaValue.trim() !== '') {
        // 실제 textarea 값으로 currentAnswer 동기화
        setCurrentAnswer(actualTextareaValue);
        await handleSaveAnswer(actualTextareaValue, true); // 포커스 복원 건너뛰기
      }
    }
    // 4지선다인 경우 기존 로직 유지
    else if (currentQuestion && currentQuestion.format === 'multiple-choice' && currentAnswer !== null) {
      await handleSaveAnswer(currentAnswer as number, true); // 포커스 복원 건너뛰기
    }
    
    if (typeof direction === 'number') {
      goToQuestion(direction);
    } else if (direction === 'next') {
      nextQuestion();
    } else {
      previousQuestion();
    }
  };

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

  // 임시 타이머 종료 버튼 (개발용)
  const handleForceTimeExpire = () => {
    if (confirm('타이머를 강제로 종료하시겠습니까? (개발용)')) {
      handleFinishTest();
    }
  };

  // 테스트 데이터 초기화 (개발용)
  const handleResetTestData = async () => {
    if (!confirm('⚠️ 경고\n\n현재 테스트 결과와 평가 기록이 모두 삭제됩니다.\n정말로 초기화하시겠습니까?\n\n초기화 후 새로운 테스트를 다시 시작할 수 있습니다.')) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('/api/test-sessions/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ 테스트 데이터가 초기화되었습니다.\n페이지를 새로고침하여 새로운 테스트를 시작할 수 있습니다.');
        
        // 클라이언트 상태 초기화
        resetTest(); // Zustand 스토어 초기화
        setTestCompletionInfo({ isCompleted: false });
        setCandidateStatus('pending');
        setTestStarted(false);
        setCurrentAnswer(null);
        setSaveStatus('saved');
        
        // 페이지 새로고침으로 완전 초기화
        window.location.reload();
      } else {
        alert(`❌ 초기화 실패\n\n${result.message || '알 수 없는 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      console.error('테스트 데이터 초기화 오류:', error);
      alert('❌ 초기화 중 오류가 발생했습니다.\n나중에 다시 시도해주세요.');
    } finally {
      setIsResetting(false);
    }
  };

  // 4지선다 답안 선택
  const handleMultipleChoiceSelect = async (optionIndex: number) => {
    setCurrentAnswer(optionIndex);
    
    // 즉시 저장 (새로운 값으로)
    if (currentQuestion && currentSession) {
      setSaveStatus('saving');
      try {
        const result = await submitAnswer(currentQuestion.id, optionIndex);
        if (result && result.success) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch (error) {
        console.error('답안 저장 오류:', error);
        setSaveStatus('error');
      }
    }
  };

  // 서술형 답안 입력
  const handleEssayChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentAnswer(event.target.value);
  };

  // 테스트 완료 화면
  if (testCompletionInfo.isCompleted) {
    const isNormalCompletion = testCompletionInfo.reason === 'completed';
    const isCheatingTermination = testCompletionInfo.reason === 'cheating';
    const isTimeExpired = testCompletionInfo.reason === 'time-expired';

    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isNormalCompletion ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className="text-3xl">
                  {isNormalCompletion ? '✅' : '❌'}
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isNormalCompletion ? '테스트 완료' : '테스트 종료'}
            </h1>
            <p className="text-gray-600">
              {user?.name}님의 온라인 면접이 
              {isNormalCompletion ? ' 성공적으로 완료되었습니다.' : '종료되었습니다.'}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 완료/종료 상세 정보 */}
            <div className={`border-l-4 p-4 rounded-r-md ${
              isNormalCompletion 
                ? 'bg-green-50 border-green-400' 
                : 'bg-red-50 border-red-400'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className={`text-lg ${
                    isNormalCompletion ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {isNormalCompletion ? '🎉' : '⚠️'}
                  </span>
                </div>
                <div className="ml-3">
                  <h3 className={`text-lg font-medium mb-2 ${
                    isNormalCompletion ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {isNormalCompletion && '정상 완료'}
                    {isCheatingTermination && '부정행위 감지로 인한 종료'}
                    {isTimeExpired && '시간 초과로 인한 종료'}
                  </h3>
                  <p className={`leading-relaxed ${
                    isNormalCompletion ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {isNormalCompletion && 
                      '모든 문제에 대한 답변이 성공적으로 제출되었습니다. 평가 결과는 관리자가 검토 후 별도로 안내드릴 예정입니다.'}
                    {isCheatingTermination && 
                      '테스트 진행 중 포커스 이탈이 3회 감지되어 테스트가 자동으로 종료되었습니다. 추가 문의사항이 있으시면 관리자에게 연락해주세요.'}
                    {isTimeExpired && 
                      '제한 시간 90분이 초과되어 테스트가 자동으로 종료되었습니다. 제출된 답안까지만 평가에 반영됩니다.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 완료 시간 정보 */}
            {testCompletionInfo.completedAt && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="font-medium text-gray-900 mb-2">완료 정보</h4>
                <p className="text-sm text-gray-600">
                  완료 시간: {new Date(testCompletionInfo.completedAt).toLocaleString('ko-KR')}
                </p>
              </div>
            )}

            {/* 다음 단계 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-900 mb-2">다음 단계</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  평가 결과는 관리자가 검토 후 이메일로 안내드립니다.
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  추가 문의사항이 있으시면 담당자에게 연락해주세요.
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  결과 발표까지 잠시만 기다려주시기 바랍니다.
                </li>
              </ul>
            </div>

            {/* 개발용 초기화 섹션 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">🛠️ 개발자 도구</h4>
                  <p className="text-sm text-yellow-700">
                    테스트 데이터를 초기화하여 새로운 테스트를 다시 시작할 수 있습니다.
                  </p>
                </div>
                <Button
                  onClick={handleResetTestData}
                  disabled={isResetting}
                  variant="ghost"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2 min-w-[100px]"
                >
                  {isResetting ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      초기화 중...
                    </>
                  ) : (
                    '🔄 초기화'
                  )}
                </Button>
              </div>
              <div className="mt-3 text-xs text-yellow-600">
                ⚠️ 주의: 현재 테스트 결과와 평가 기록이 모두 삭제됩니다.
              </div>
            </div>


          </CardContent>
        </Card>
      </div>
    );
  }

  // 테스트 시작 전 안내 화면
  if (!testStarted) {
    // 상태별 메시지 및 UI 구성
    const getStatusContent = () => {
      switch (candidateStatus) {
        case 'testing':
          return {
            icon: '🔄',
            bgColor: 'bg-blue-100',
            title: '테스트 진행 중',
            description: '이미 테스트가 진행 중입니다.',
            content: (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-500 text-lg">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">
                      진행 중인 테스트가 있습니다
                    </h3>
                    <p className="text-blue-700 leading-relaxed">
                      현재 진행 중인 테스트가 있습니다. 테스트 세션이 활성화되어 있다면 계속 진행하실 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            ),
            canStart: true,
            buttonText: '테스트 계속하기'
          };
        
        case 'evaluated':
          return {
            icon: '✅',
            bgColor: 'bg-green-100',
            title: '테스트 완료',
            description: '이미 테스트를 완료하셨습니다.',
            content: (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-green-500 text-lg">✅</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-green-800 mb-2">
                      테스트가 이미 완료되었습니다
                    </h3>
                    <p className="text-green-700 leading-relaxed">
                      테스트를 이미 완료하셨습니다. 평가 결과는 관리자가 검토 후 별도로 안내드릴 예정입니다.
                    </p>
                  </div>
                </div>
              </div>
            ),
            canStart: false,
            buttonText: null // 버튼 제거
          };
        
        case 'pending':
        default:
          return {
            icon: '⚠️',
            bgColor: 'bg-yellow-100',
            title: '온라인 면접 시작 전 주의사항',
            description: '면접을 시작하기 전에 아래 내용을 반드시 확인해주세요.',
            content: (
              <>
                {/* 주요 주의사항 */}
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-red-500 text-lg">🚨</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-red-800 mb-2">
                        중요한 주의사항
                      </h3>
                      <p className="text-red-700 leading-relaxed">
                        온라인 면접을 시작한 후 <strong>웹 브라우저의 다른 탭으로 포커스가 이동</strong>하거나, 
                        <strong>다른 프로그램을 활성화</strong> 하면 <strong>시험이 강제 종료</strong>되며 
                        응답하지 않은 문제는 <strong>0점 처리</strong> 됩니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 추가 안내사항 */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900 mb-3">면접 진행 안내</h4>
                  <ul className="space-y-2 text-blue-800 text-sm">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      총 25문제 (기술 10문제, 인성 5문제, 문제해결 10문제)로 구성됩니다.
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      제한 시간은 총 90분이며, 남은 시간이 화면에 표시됩니다.
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      답안은 자동으로 저장되며, 언제든 이전 문제로 돌아가서 수정할 수 있습니다.
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      포커스를 3회 잃으면 테스트가 자동 종료됩니다.
                    </li>
                  </ul>
                </div>
              </>
            ),
            canStart: true,
            buttonText: '면접 시작하기'
          };
      }
    };

    const statusContent = getStatusContent();

    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className={`w-16 h-16 ${statusContent.bgColor} rounded-full flex items-center justify-center`}>
                <span className="text-3xl">{statusContent.icon}</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {statusContent.title}
            </h1>
            <p className="text-gray-600">
              {user?.name}님, {statusContent.description}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 상태별 내용 */}
            {statusContent.content}

            {/* 동의 체크박스 (pending 상태일 때만) */}
            {candidateStatus === 'pending' && (
              <div className="border-t pt-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    위의 모든 주의사항을 충분히 읽고 이해했으며, 
                    <strong> 부정행위 방지 정책에 동의</strong>합니다.
                  </span>
                </label>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex justify-between items-center pt-4">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                className="text-gray-600 hover:text-gray-800"
              >
                이전으로
              </Button>
              
              {/* 버튼이 필요한 경우에만 표시 */}
              {statusContent.buttonText && (
                <Button
                  onClick={statusContent.canStart ? handleStartTest : () => router.push('/')} // 메인 페이지로 이동
                  variant="primary"
                  disabled={statusContent.canStart && candidateStatus === 'pending' && (!isAgreed || loading)}
                  className={`px-8 py-3 text-lg font-medium ${
                    statusContent.canStart && (candidateStatus !== 'pending' || (isAgreed && !loading))
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? '시작 중...' : statusContent.buttonText}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 테스트 진행 화면
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">질문을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">온라인 면접 진행</h1>
            <p className="text-sm text-gray-600">{user?.name}님의 면접이 진행 중입니다.</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* 포커스 이탈 경고 */}
            {focusLostCount > 0 && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                ⚠️ 경고 {focusLostCount}/3
              </div>
            )}
            
            {/* 타이머 */}
            <Timer 
              initialTime={remainingTime || 90 * 60}
              onTimeUp={handleTimeUp}
              onTimeUpdate={handleTimeUpdate}
            />
            
            {/* 임시 타이머 종료 버튼 */}
            <Button
              onClick={handleForceTimeExpire}
              variant="ghost"
              className="text-red-600 hover:text-red-800 text-xs"
            >
              [DEV] 타이머 종료
            </Button>
          </div>
        </div>
      </div>

      {/* 진행 상황 */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700">
            진행 상황: {currentQuestionIndex + 1} / {questions.length}
          </span>
          <span className="text-sm text-gray-600">
            답변 완료: {answeredCount} / {questions.length}
          </span>
        </div>
        
        {/* 진행바 */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-sky-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 질문 영역 */}
        <div className="col-span-8">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    문제 {currentQuestionIndex + 1}
                  </h2>
                  <div className="flex space-x-2 mt-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {currentQuestion.type === 'technical' ? '기술' : 
                       currentQuestion.type === 'personality' ? '인성' : '문제해결'}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {currentQuestion.difficulty === 'easy' ? '쉬움' :
                       currentQuestion.difficulty === 'medium' ? '보통' : '어려움'}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {currentQuestion.points}점
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.question}
                </p>
              </div>

              {/* 답안 입력 영역 */}
              {currentQuestion.format === 'multiple-choice' ? (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleMultipleChoiceSelect(index)}
                      className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                        currentAnswer !== null && currentAnswer === index
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">
                        {String.fromCharCode(65 + index)}. 
                      </span>
                      <span className="ml-2">{option}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    답안을 입력해주세요:
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={currentAnswer as string || ''}
                    onChange={handleEssayChange}
                    onBlur={handleTextareaBlur}
                    placeholder="여기에 답안을 작성해주세요..."
                    className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900"
                    disabled={isSubmitting}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    글자 수: {(currentAnswer as string || '').length}자
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 네비게이션 영역 */}
        <div className="col-span-4">
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">문제 목록</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((_, index) => {
                  const isAnswered = answers.some(a => a.id === questions[index].id);
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuestionMove(index)}
                      className={`w-8 h-8 text-xs rounded border-2 transition-all ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : isAnswered
                          ? 'border-green-500 bg-green-100 text-green-800'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* 네비게이션 버튼 */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleQuestionMove('prev')}
                    disabled={currentQuestionIndex === 0}
                    variant="ghost"
                    className="flex-1"
                  >
                    이전
                  </Button>
                  <Button
                    onClick={() => handleQuestionMove('next')}
                    disabled={currentQuestionIndex === questions.length - 1}
                    variant="ghost"
                    className="flex-1"
                  >
                    다음
                  </Button>
                </div>
                
                <Button
                  onClick={handleFinishTest}
                  variant="primary"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  테스트 완료
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 저장 상태 표시 */}
      <div className="fixed bottom-4 right-4">
        <div className={`px-3 py-2 rounded-lg text-sm ${
          saveStatus === 'saved' ? 'bg-green-100 text-green-800' :
          saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {saveStatus === 'saved' ? '✓ 자동 저장됨' :
           saveStatus === 'saving' ? '⟳ 저장 중...' :
           '✗ 저장 실패'}
        </div>
      </div>
    </div>
  );
} 