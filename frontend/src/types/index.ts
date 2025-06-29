// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'candidate';
  createdAt: Date;
  updatedAt: Date;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

export interface Candidate extends User {
  role: 'candidate';
  phone: string;
  experience: number; // 경력 기간 (년)
  appliedField: 'java' | 'csharp'; // 지원 분야
  status: 'pending' | 'testing' | 'completed' | 'evaluated';
  testSessionId?: string;
}

// 질문 관련 타입
export type QuestionType = 'technical' | 'personality' | 'problem-solving';
export type QuestionFormat = 'multiple-choice' | 'essay';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ExperienceLevel = 'junior' | 'senior';

export interface Question {
  id: string;
  type: QuestionType;
  format: QuestionFormat;
  difficulty: Difficulty;
  experienceLevel: ExperienceLevel;
  field?: 'java' | 'csharp' | 'common'; // technical 질문에만 적용
  category?: string; // HTML, Javascript, Java, C#, MariaDB, MSSQL 등
  question: string;
  options?: string[]; // 4지 선다형인 경우
  correctAnswer?: number; // 4지 선다형 정답 번호 (0-3)
  correctAnswerText?: string; // 서술형 정답 문장
  requiredKeywords?: string[]; // 서술형 필수 포함 단어
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

// 테스트 세션 관련 타입
export interface TestSession {
  id: string;
  candidateId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'terminated';
  startedAt?: Date;
  completedAt?: Date;
  terminatedAt?: Date;
  terminationReason?: 'cheating' | 'time-expired' | 'technical-error';
  questions: string[]; // 질문 ID 배열
  answers: TestAnswer[];
  remainingTime: number; // 남은 시간 (초)
  totalTime: number; // 전체 시간 (초)
  cheatingAttempts: number;
  focusLostCount: number; // 포커스 잃은 횟수
}

export interface TestAnswer {
  questionId: string;
  answer: string | number; // 선택형은 번호, 서술형은 텍스트
  answeredAt: Date;
  timeTaken: number; // 답변에 소요된 시간 (초)
}

// 평가 관련 타입
export interface Evaluation {
  id: string;
  candidateId: string;
  testSessionId: string;
  technicalScore: number;
  personalityScore: number;
  problemSolvingScore: number;
  totalScore: number;
  detailedResults: EvaluationDetail[];
  llmEvaluations: LLMEvaluation[];
  evaluatedAt: Date;
  evaluatedBy: string; // 관리자 ID
  status: 'pending' | 'completed';
  notes?: string;
}

export interface EvaluationDetail {
  questionId: string;
  userAnswer: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
}

export interface LLMEvaluation {
  questionId: string;
  userAnswer: string;
  expectedAnswer: string;
  requiredKeywords: string[];
  llmScore: number; // 0-100
  llmFeedback: string;
  keywordsFound: string[];
  evaluatedAt: Date;
}

// 설정 관련 타입
export interface TestConfig {
  id: string;
  name: string;
  totalTime: number; // 전체 시험 시간 (분)
  difficultyDistribution: {
    easy: number; // 퍼센트
    medium: number;
    hard: number;
  };
  questionCounts: {
    technical: number;
    personality: number;
    problemSolving: number;
  };
  cheatingToleranceLevel: number; // 허용 가능한 포커스 잃은 횟수
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 폼 관련 타입
export interface LoginForm {
  email: string;
  password: string;
}

export interface CandidateRegistrationForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  experience: number;
  appliedField: 'java' | 'csharp';
}

export interface QuestionForm {
  type: QuestionType;
  format: QuestionFormat;
  difficulty: Difficulty;
  experienceLevel: ExperienceLevel;
  field?: 'java' | 'csharp' | 'common';
  category?: string;
  question: string;
  options?: string[];
  correctAnswer?: number;
  correctAnswerText?: string;
  requiredKeywords?: string[];
  points: number;
}

// 통계 관련 타입
export interface DashboardStats {
  totalCandidates: number;
  completedTests: number;
  averageScore: number;
  passRate: number;
  recentTests: TestSession[];
}

export interface ScoreDistribution {
  scoreRange: string;
  count: number;
  percentage: number;
} 