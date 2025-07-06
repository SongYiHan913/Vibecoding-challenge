'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { API_ENDPOINTS } from '@/constants';
import { useAuthStore } from '@/store/authStore';

interface Question {
  id: string;
  type: 'technical' | 'personality' | 'problem-solving';
  format: 'multiple-choice' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  experienceLevel: 'junior' | 'senior';
  field?: 'java' | 'csharp' | 'common';
  category?: string;
  question: string;
  options?: string[];
  correct_answer?: number;
  correct_answer_text?: string;
  required_keywords?: string[];
  points: number;
}

interface Answer {
  id: string;
  questionOrder?: number;
  answer?: number;
  answerText?: string;
  submittedAt: string;
}

interface DetailedResult {
  questionId: string;
  type: string;
  format: string;
  question: string;
  candidateAnswer: string | number;
  correctAnswer?: number | string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  explanation?: string;
}

interface Evaluation {
  id: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    phone: string;
    appliedField: string;
    experience: number;
  };
  testSessionId: string;
  scores: {
    technical: number;
    personality: number;
    problemSolving: number;
    total: number;
  };
  detailedResults: DetailedResult[];
  llmEvaluations: any[];
  status: string;
  notes: string;
  evaluatedAt: string;
  createdAt: string;
}

interface TestSession {
  id: string;
  candidate_id: string;
  status: string;
  started_at: string;
  completed_at: string;
  terminated_at: string;
  termination_reason: string;
  questions: Question[];
  answers: Answer[];
  remaining_time: number;
  total_time: number;
  cheating_attempts: number;
  focus_lost_count: number;
  created_at: string;
  updated_at: string;
}

export default function GradingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { token } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<TestSession | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [editingScores, setEditingScores] = useState<{[key: string]: number}>({});
  const [showLLMModal, setShowLLMModal] = useState(false);
  const [llmPrompt, setLlmPrompt] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [keywordBasedScore, setKeywordBasedScore] = useState<number>(0);
  const [tempScore, setTempScore] = useState<number>(0);
  const [maxScoreForModal, setMaxScoreForModal] = useState<number>(0);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);

      // 테스트 세션 정보 조회
      const sessionResponse = await fetch(`${API_ENDPOINTS.TEST_SESSIONS}/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!sessionResponse.ok) {
        throw new Error('세션 조회 실패');
      }

      const sessionResult = await sessionResponse.json();
      if (sessionResult.success) {
        setSession(sessionResult.data);
      }

      // 평가 정보 조회 (있는 경우에만)
      try {
        const evaluationResponse = await fetch(`${API_ENDPOINTS.EVALUATIONS}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (evaluationResponse.ok) {
          const evaluationResult = await evaluationResponse.json();
          if (evaluationResult.success) {
            // 해당 세션의 평가 찾기
            const sessionEvaluation = evaluationResult.data.evaluations.find(
              (evaluation: any) => evaluation.testSessionId === sessionId
            );

            if (sessionEvaluation) {
              // 평가 상세 정보 조회
              const detailResponse = await fetch(`${API_ENDPOINTS.EVALUATIONS}/${sessionEvaluation.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (detailResponse.ok) {
                const detailResult = await detailResponse.json();
                if (detailResult.success) {
                  setEvaluation(detailResult.data);
                  setNotes(detailResult.data.notes || '');
                  
                  // 편집용 점수 초기화
                  const initialScores: {[key: string]: number} = {};
                  if (detailResult.data.detailedResults) {
                    detailResult.data.detailedResults.forEach((result: DetailedResult) => {
                      initialScores[result.questionId] = result.score;
                    });
                  }
                  setEditingScores(initialScores);
                }
              }
            }
          }
        }
      } catch (evalError) {
        console.log('평가 정보 없음 또는 조회 실패:', evalError);
      }

    } catch (error) {
      console.error('데이터 조회 오류:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (questionId: string, newScore: number) => {
    setEditingScores(prev => ({
      ...prev,
      [questionId]: newScore
    }));
  };

  const handleSaveScores = async () => {
    if (!evaluation || !session) return;

    if (session.status !== 'completed') {
      alert('완료된 테스트만 채점할 수 있습니다.');
      return;
    }

    if (!confirm('채점을 완료하시겠습니까? 완료 후에는 점수를 수정할 수 없습니다.')) {
      return;
    }

    try {
      setSaving(true);

      // 새로운 detailedResults 생성
      const updatedResults = evaluation.detailedResults.map(result => ({
        ...result,
        score: editingScores[result.questionId] || result.score
      }));

      // 점수 업데이트 및 상태 변경
      const response = await fetch(`${API_ENDPOINTS.EVALUATIONS}/${evaluation.id}/scores`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          detailedResults: updatedResults,
          notes: notes,
          finalizeGrading: true // 채점 완료 플래그
        })
      });

      if (!response.ok) {
        throw new Error('채점 완료 처리 실패');
      }

      const result = await response.json();
      if (result.success) {
        alert('채점이 성공적으로 완료되었습니다.');
        fetchSessionData(); // 데이터 새로고침
      } else {
        throw new Error(result.message || '채점 완료 처리 실패');
      }
    } catch (error) {
      console.error('채점 완료 처리 오류:', error);
      alert('채점 완료 처리 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const generateLLMPrompt = (questionId: string): string => {
    if (!session || !evaluation) return '';

    // 해당 질문 찾기
    const question = session.questions.find(q => q.id === questionId);
    if (!question) return '';

    // 해당 답안 찾기
    const answer = session.answers?.find(a => a.id === questionId);
    if (!answer) return '';

    // 현재 채점 결과 찾기
    const currentResult = evaluation.detailedResults.find(r => r.questionId === questionId);
    const currentScore = editingScores[questionId] ?? (currentResult?.score || 0);
    const maxScore = question.points;

    // 문제 유형별 평가 기준 설정
    let evaluationCriteria = '';
    let specificInstructions = '';

    if (question.type === 'technical') {
      evaluationCriteria = `
기술적 정확성:
- 문법과 구문의 정확성
- 개념 이해도
- 실무 적용 가능성
- 최적화 및 효율성 고려

평가 기준:
- 완전히 정확한 답변: 80-100%
- 대체로 정확하나 일부 오류: 60-79%
- 기본 개념은 이해하나 중요한 오류: 40-59%
- 부분적 이해만 보임: 20-39%
- 거의 틀리거나 무응답: 0-19%`;

      if (question.field === 'java') {
        specificInstructions = `
Java 관련 문제 특별 고려사항:
- 객체지향 프로그래밍 원칙 적용
- 메모리 관리 및 성능 최적화
- 예외 처리 및 안전성
- 코드 가독성 및 유지보수성`;
      } else if (question.field === 'csharp') {
        specificInstructions = `
C# 관련 문제 특별 고려사항:
- .NET 프레임워크 활용
- 메모리 관리 및 가비지 컬렉션
- LINQ 및 람다식 활용
- 비동기 프로그래밍 패턴`;
      }
    } else if (question.type === 'personality') {
      evaluationCriteria = `
인성 평가 기준:
- 상황 이해도 및 판단력
- 의사소통 능력
- 팀워크 및 협업 자세
- 문제 해결 접근 방식
- 윤리적 판단력

평가 기준:
- 매우 우수한 답변: 80-100%
- 우수한 답변: 60-79%
- 보통 수준의 답변: 40-59%
- 부족한 답변: 20-39%
- 매우 부족한 답변: 0-19%`;
    } else if (question.type === 'problem-solving') {
      evaluationCriteria = `
문제 해결 능력 평가 기준:
- 문제 분석 및 이해도
- 논리적 사고 과정
- 창의적 해결 방안
- 단계별 접근 방식
- 실현 가능성

평가 기준:
- 탁월한 문제 해결 능력: 80-100%
- 우수한 문제 해결 능력: 60-79%
- 보통의 문제 해결 능력: 40-59%
- 부족한 문제 해결 능력: 20-39%
- 매우 부족한 문제 해결 능력: 0-19%`;
    }

    // 프롬프트 생성
    const prompt = `
### 온라인 면접 시스템 - 답안 평가 요청

**지원자 정보:**
- 이름: ${evaluation.candidate.name}
- 지원 분야: ${evaluation.candidate.appliedField?.toUpperCase() || 'N/A'}
- 경력: ${evaluation.candidate.experience || 0}년

**문제 정보:**
- 문제 유형: ${question.type === 'technical' ? '기술' : question.type === 'personality' ? '인성' : '문제해결'}
- 문제 형식: ${question.format === 'multiple-choice' ? '객관식' : '주관식'}
- 난이도: ${question.difficulty === 'easy' ? '쉬움' : question.difficulty === 'medium' ? '보통' : '어려움'}
- 배점: ${maxScore}점
- 현재 점수: ${currentScore}점

**문제:**
${question.question}

${question.options && question.format === 'multiple-choice' ? `
**선택지:**
${question.options.map((option, index) => `${index + 1}. ${option}`).join('\n')}

**정답:** ${question.correct_answer !== undefined ? question.correct_answer + 1 : 'N/A'}번
` : ''}

${question.correct_answer_text ? `
**모범 답안:**
${question.correct_answer_text}
` : ''}

${question.required_keywords && question.required_keywords.length > 0 ? `
**필수 키워드:**
${question.required_keywords.join(', ')}
` : ''}

**지원자 답안:**
${typeof answer.answer === 'number' ? `선택한 답: ${answer.answer + 1}번` : answer.answerText || '답안 없음'}

**제출 시간:** ${new Date(answer.submittedAt).toLocaleString('ko-KR')}

---

**평가 요청:**

${evaluationCriteria}

${specificInstructions}

**현재 채점 결과:**
- 현재 점수: ${currentScore}점 / ${maxScore}점 (${Math.round((currentScore / maxScore) * 100)}%)

**요청 사항:**
위 정보를 바탕으로 답안을 평가하고, 다음 형식으로 응답해주세요:

1. **평가 점수 제안:** X점 / ${maxScore}점 (X%)
2. **평가 근거:** 
   - 좋은 점:
   - 부족한 점:
   - 개선 제안:
3. **최종 권장 사항:** 현재 점수 유지 또는 수정 권장

**중요:** 평가는 공정하고 객관적이어야 하며, 지원자의 경력 수준(${evaluation.candidate.experience || 0}년)을 고려하여 적절한 수준에서 평가해주세요.
`;

    return prompt.trim();
  };

  const calculateKeywordBasedScore = (questionId: string): number => {
    if (!session || !evaluation) return 0;

    const question = session.questions.find(q => q.id === questionId);
    const answer = session.answers?.find(a => a.id === questionId);
    
    if (!question || !answer || question.format !== 'essay' || !question.required_keywords || !answer.answerText) {
      return 0;
    }

    const keywords = question.required_keywords;
    const answerText = answer.answerText.toLowerCase();
    
    // 키워드 매칭 개수 계산
    const matchedKeywords = keywords.filter(keyword => 
      answerText.includes(keyword.toLowerCase())
    );
    
    // 키워드 매칭 비율로 점수 계산 (최대 점수의 70%까지만)
    const keywordScore = (matchedKeywords.length / keywords.length) * question.points * 0.7;
    
    return Math.round(keywordScore);
  };

  const handleLLMEvaluation = (questionId: string) => {
    if (!session || !evaluation) return;

    const question = session.questions.find(q => q.id === questionId);
    if (!question) return;

    const currentResult = evaluation.detailedResults.find(r => r.questionId === questionId);
    const currentScore = editingScores[questionId] ?? (currentResult?.score || 0);
    
    setSelectedQuestionId(questionId);
    setMaxScoreForModal(question.points);
    setTempScore(currentScore);
    
    // 키워드 기반 자동 채점 실행
    const autoScore = calculateKeywordBasedScore(questionId);
    setKeywordBasedScore(autoScore);
    
    const prompt = generateLLMPrompt(questionId);
    setLlmPrompt(prompt);
    setShowLLMModal(true);
  };

  const handleApplyScore = () => {
    if (selectedQuestionId) {
      handleScoreChange(selectedQuestionId, tempScore);
      setShowLLMModal(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었습니다.');
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'personality':
        return 'bg-green-100 text-green-800';
      case 'problem-solving':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900">세션 정보를 찾을 수 없습니다.</p>
          <Button onClick={() => router.back()} className="mt-4">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (session.status !== 'completed' && session.status !== 'terminated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900">완료되지 않은 테스트는 채점할 수 없습니다.</p>
          <p className="text-gray-600 mt-2">현재 상태: {session.status}</p>
          <Button onClick={() => router.back()} className="mt-4">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 치팅으로 종료된 경우 채점 불가 처리
  if (session.termination_reason === 'cheating') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🚫</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                치팅 감지로 종료된 테스트
              </h1>
              <p className="text-gray-600">
                부정행위가 감지되어 종료된 테스트는 채점할 수 없습니다.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 치팅 상세 정보 */}
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-500 text-lg">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800 mb-2">
                      부정행위 감지 상세
                    </h3>
                    <ul className="text-red-700 space-y-1 text-sm">
                      <li>• 포커스 이탈 횟수: {session.focus_lost_count || 0}회</li>
                      <li>• 종료 시간: {session.terminated_at ? new Date(session.terminated_at).toLocaleString('ko-KR') : 'N/A'}</li>
                      <li>• 종료 사유: 포커스 이탈 한계 초과 (3회)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="font-medium text-gray-900 mb-2">테스트 기본 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">시작 시간</p>
                    <p className="text-gray-900">{session.started_at ? new Date(session.started_at).toLocaleString('ko-KR') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">종료 시간</p>
                    <p className="text-gray-900">{session.terminated_at ? new Date(session.terminated_at).toLocaleString('ko-KR') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">진행 시간</p>
                    <p className="text-gray-900">
                      {session.started_at && session.terminated_at ? 
                        `${Math.floor((new Date(session.terminated_at).getTime() - new Date(session.started_at).getTime()) / 60000)}분` : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">답변 완료 문제</p>
                    <p className="text-gray-900">{session.answers?.length || 0}개</p>
                  </div>
                </div>
              </div>

              {/* 제출된 답안 미리보기 */}
              {session.answers && session.answers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900 mb-2">제출된 답안 현황</h4>
                  <p className="text-sm text-blue-800">
                    총 {session.questions?.length || 0}문제 중 {session.answers.length}문제 답변 완료
                  </p>
                  <div className="mt-2 text-xs text-blue-700">
                    ※ 부정행위로 인한 조기 종료로 채점이 불가능합니다.
                  </div>
                </div>
              )}

              {/* 관리자 안내 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="font-medium text-yellow-900 mb-2">관리자 안내</h4>
                <ul className="space-y-1 text-sm text-yellow-800">
                  <li>• 이 테스트는 부정행위 감지로 인해 자동 종료되었습니다.</li>
                  <li>• 채점 및 평가가 불가능한 상태입니다.</li>
                  <li>• 필요 시 지원자에게 재시험 기회를 제공할 수 있습니다.</li>
                  <li>• 추가 조치가 필요한 경우 관리자에게 문의하세요.</li>
                </ul>
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-center pt-4">
                <Button onClick={() => router.back()} variant="secondary">
                  목록으로 돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">채점 상세 관리</h1>
          <p className="text-gray-700 mt-1">
            지원자의 테스트 결과를 확인하고 채점을 관리합니다.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-gray-900"
          >
            ← 돌아가기
          </Button>
          {evaluation && session?.status === 'completed' && (
            <Button
              onClick={handleSaveScores}
              variant="primary"
              disabled={saving}
            >
              {saving ? '처리 중...' : '채점 완료'}
            </Button>
          )}
        </div>
      </div>

      {/* 지원자 정보 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">지원자 정보</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">이름</p>
              <p className="text-lg text-gray-900">{evaluation?.candidate.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">이메일</p>
              <p className="text-lg text-gray-900">{evaluation?.candidate.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">지원 분야</p>
              <p className="text-lg text-gray-900">{evaluation?.candidate.appliedField?.toUpperCase() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">경력</p>
              <p className="text-lg text-gray-900">{evaluation?.candidate.experience || 0}년</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 테스트 정보 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">테스트 정보</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">상태</p>
              <div className="flex items-center space-x-2">
                <p className="text-lg text-gray-900">
                  {session.status === 'completed' ? '완료' : 
                   session.status === 'terminated' ? 
                     (session.termination_reason === 'time-expired' ? '시간 초과 완료' : '채점 완료') : 
                   session.status}
                </p>
                {session.status === 'terminated' && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.termination_reason === 'time-expired' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {session.termination_reason === 'time-expired' ? '시간초과' : '확정'}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">시작 시간</p>
              <p className="text-lg text-gray-900">
                {session.started_at ? new Date(session.started_at).toLocaleString('ko-KR') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">완료 시간</p>
              <p className="text-lg text-gray-900">
                {session.completed_at ? new Date(session.completed_at).toLocaleString('ko-KR') : 
                 session.terminated_at ? new Date(session.terminated_at).toLocaleString('ko-KR') : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">포커스 이탈 횟수</p>
              <div className="flex items-center space-x-2">
                <p className={`text-lg ${(session.focus_lost_count || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {session.focus_lost_count || 0}회
                </p>
                {(session.focus_lost_count || 0) > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    {(session.focus_lost_count || 0) >= 3 ? '위험' : '주의'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 전체 점수 */}
      {evaluation && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">전체 점수</h2>
            <p className="text-gray-700 mt-1">
              점수는 지원자 간 상대적 비교를 위해 백분율 점수로 계산/표시됩니다. 표시 배점과 다를 수 있습니다.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">기술 점수</p>
                <p className="text-2xl font-bold text-blue-600">{evaluation.scores.technical.toFixed(1)}점</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">인성 점수</p>
                <p className="text-2xl font-bold text-green-600">{evaluation.scores.personality.toFixed(1)}점</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">문제해결 점수</p>
                <p className="text-2xl font-bold text-purple-600">{evaluation.scores.problemSolving.toFixed(1)}점</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">총점</p>
                <p className={`text-3xl font-bold ${getScoreColor(evaluation.scores.total, 100)}`}>
                  {evaluation.scores.total.toFixed(1)}점
                </p>
              </div>
            </div>
            
            {/* 테스트 진행 관련 추가 정보 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">테스트 진행 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">테스트 완료:</span>
                  <span className={`font-medium ${
                    session.termination_reason === 'time-expired' ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {session.termination_reason === 'time-expired' ? '시간 초과로 완료' : '정상 완료'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">포커스 이탈:</span>
                  <span className={`font-medium ${
                    (session.focus_lost_count || 0) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {session.focus_lost_count || 0}회
                  </span>
                  {(session.focus_lost_count || 0) > 0 && (
                    <span className="text-xs text-red-600">(주의 필요)</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">답변 완료:</span>
                  <span className="font-medium text-gray-900">
                    {session.answers?.length || 0}/{session.questions?.length || 0}문제
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 문제별 상세 결과 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">문제별 채점 결과</h2>
        </CardHeader>
        <CardContent>
          {session.questions && session.questions.length > 0 ? (
            <div className="space-y-6">
              {session.questions.map((question, index) => {
              const answer = session.answers?.find?.(a => a.id === question.id);
              const result = evaluation?.detailedResults.find(r => r.questionId === question.id);
              const currentScore = editingScores[question.id] ?? (result?.score || 0);

              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg font-medium text-gray-900">
                          문제 {index + 1}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(question.type)}`}>
                          {question.type === 'technical' ? '기술' : 
                           question.type === 'personality' ? '인성' : '문제해결'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty === 'easy' ? '쉬움' : 
                           question.difficulty === 'medium' ? '보통' : '어려움'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {question.format === 'multiple-choice' ? '객관식' : '주관식'}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-4">{question.question}</p>
                      
                      {question.options && question.format === 'multiple-choice' && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">선택지:</p>
                          <div className="space-y-1">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className={`p-2 rounded ${
                                question.correct_answer === (optIndex + 1) ? 'bg-green-50 border border-green-200' :
                                (typeof answer?.answer === 'number' && answer.answer === optIndex) ? 'bg-red-50 border border-red-200' : 
                                'bg-gray-50'
                              }`}>
                                <span className="text-sm text-gray-900">
                                  {optIndex + 1}. {option}
                                  {question.correct_answer === (optIndex + 1) && (
                                    <span className="ml-2 text-green-600 font-medium">(정답)</span>
                                  )}
                                  {typeof answer?.answer === 'number' && answer.answer === optIndex && (
                                    <span className="ml-2 text-blue-600 font-medium">(선택)</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {question.correct_answer_text && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm font-medium text-gray-700 mb-1">모범 답안:</p>
                          <p className="text-sm text-gray-900">{question.correct_answer_text}</p>
                        </div>
                      )}

                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm font-medium text-gray-700 mb-1">지원자 답안:</p>
                        <p className="text-sm text-gray-900">
                          {typeof answer?.answer === 'number' 
                            ? `${answer.answer + 1}번 선택` 
                            : answer?.answerText || '답안 없음'}
                        </p>
                        {answer && (
                          <p className="text-xs text-gray-600 mt-1">
                            제출 시간: {new Date(answer.submittedAt).toLocaleString('ko-KR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 점수 편집 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">점수:</label>
                        <Input
                          type="number"
                          min="0"
                          max={question.points}
                          value={currentScore}
                          onChange={(e) => handleScoreChange(question.id, Number(e.target.value))}
                          className="w-20"
                          disabled={!evaluation || session?.status !== 'completed'}
                        />
                        <span className="text-sm text-gray-700">/ {question.points}점</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        ({((currentScore / question.points) * 100).toFixed(1)}%)
                      </div>
                    </div>
                    
                    {evaluation && question.format === 'essay' && (
                      <Button
                        onClick={() => handleLLMEvaluation(question.id)}
                        variant="secondary"
                        size="sm"
                        disabled={loading || session?.status !== 'completed'}
                      >
                        🤖 LLM 평가
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-700">문제 데이터를 불러올 수 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 평가 메모 */}
      {evaluation && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">평가 메모</h2>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="평가에 대한 추가 메모를 입력하세요..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={session?.status !== 'completed'}
            />
          </CardContent>
        </Card>
      )}

      {/* 하단 고정 버튼 */}
      {evaluation && session?.status === 'completed' && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-8">
          <div className="flex justify-center">
            <Button
              onClick={handleSaveScores}
              variant="primary"
              disabled={saving}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              {saving ? '처리 중...' : '📝 채점 완료'}
            </Button>
          </div>
        </div>
      )}

      {/* 채점 완료된 세션 안내 */}
      {evaluation && session?.status === 'terminated' && (
        <div className="sticky bottom-0 bg-green-50 border-t border-green-200 p-4 mt-8">
          <div className="flex justify-center">
            <div className="text-center">
              <p className="text-green-800 font-medium">✅ 채점이 완료된 세션입니다</p>
              <p className="text-green-600 text-sm">점수 및 평가 내용은 확정되어 수정할 수 없습니다</p>
            </div>
          </div>
        </div>
      )}

      {/* LLM 평가 모달 */}
      <Modal
        isOpen={showLLMModal}
        onClose={() => setShowLLMModal(false)}
        title="LLM 평가"
        size="lg"
      >
        <div className="space-y-6">
          {/* 키워드 기준 자동 채점 점수 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">키워드 기준 자동 채점</h3>
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-blue-600">
                {keywordBasedScore}점 / {maxScoreForModal}점
              </div>
              <div className="text-sm text-gray-700">
                ({((keywordBasedScore / maxScoreForModal) * 100).toFixed(1)}%)
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              * 필수 키워드 매칭률 기반으로 최대 배점의 70%까지 자동 채점됩니다.
            </p>
          </div>

          {/* 평가 점수 수정 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">평가 점수 수정</h3>
            <div className="flex items-center space-x-4 mb-4">
              <label className="text-sm font-medium text-gray-700">점수:</label>
              <Input
                type="number"
                min="0"
                max={maxScoreForModal}
                value={tempScore}
                onChange={(e) => {
                  const newScore = Number(e.target.value);
                  if (newScore <= maxScoreForModal) {
                    setTempScore(newScore);
                  }
                }}
                className="w-24"
              />
              <span className="text-sm text-gray-700">/ {maxScoreForModal}점</span>
              <div className="text-sm text-gray-600">
                ({((tempScore / maxScoreForModal) * 100).toFixed(1)}%)
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800 font-medium">
                💡 LLM이 평가한 점수를 수정하시겠습니까?
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                위 점수 입력란에서 LLM 평가 결과를 반영하여 최종 점수를 설정하세요.
              </p>
            </div>
          </div>

          {/* LLM 프롬프트 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">LLM 평가 프롬프트</h3>
            <p className="text-sm text-gray-700 mb-4">
              아래 프롬프트를 복사하여 ChatGPT, Claude 등의 LLM 서비스에 붙여넣고 평가를 받으세요.
            </p>
            <div className="relative">
              <textarea
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm font-mono"
                value={llmPrompt}
                readOnly
              />
              <Button
                onClick={() => copyToClipboard(llmPrompt)}
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
              >
                📋 복사
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              onClick={() => setShowLLMModal(false)}
              variant="ghost"
            >
              취소
            </Button>
            <div className="flex space-x-2">
              <Button
                onClick={() => copyToClipboard(llmPrompt)}
                variant="secondary"
              >
                프롬프트 복사
              </Button>
              <Button
                onClick={handleApplyScore}
                variant="primary"
              >
                점수 적용
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
} 