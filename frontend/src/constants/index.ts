// 질문 관련 상수
export const QUESTION_TYPES = {
  TECHNICAL: 'technical',
  PERSONALITY: 'personality',
  PROBLEM_SOLVING: 'problem-solving',
} as const;

export const QUESTION_FORMATS = {
  MULTIPLE_CHOICE: 'multiple-choice',
  ESSAY: 'essay',
} as const;

export const DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export const EXPERIENCE_LEVELS = {
  JUNIOR: 'junior',
  SENIOR: 'senior',
} as const;

export const APPLIED_FIELDS = {
  JAVA: 'java',
  CSHARP: 'csharp',
} as const;

// 기술 카테고리
export const TECH_CATEGORIES = {
  COMMON: ['HTML', 'Javascript'],
  JAVA: ['Java', 'MariaDB'],
  CSHARP: ['C#', 'MSSQL'],
} as const;

// 테스트 설정
export const TEST_CONFIG = {
  DEFAULT_TIME: 90, // 90분
  MAX_CHEATING_ATTEMPTS: 3,
  FOCUS_CHECK_INTERVAL: 1000, // 1초마다 포커스 체크
  AUTO_SAVE_INTERVAL: 30, // 30초마다 자동 저장
} as const;

// 점수 관련
export const SCORING = {
  TECHNICAL_WEIGHT: 0.4, // 40%
  PERSONALITY_WEIGHT: 0.3, // 30%
  PROBLEM_SOLVING_WEIGHT: 0.3, // 30%
  PASSING_SCORE: 60, // 60점 이상 합격
} as const;

// UI 관련
export const COLORS = {
  PRIMARY: 'bg-blue-600',
  SUCCESS: 'bg-green-600',
  WARNING: 'bg-yellow-600',
  DANGER: 'bg-red-600',
  SECONDARY: 'bg-gray-600',
} as const;

export const ROUTES = {
  // 인증
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  
  // 관리자
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CANDIDATES: '/admin/candidates',
  ADMIN_QUESTIONS: '/admin/questions',
  ADMIN_RESULTS: '/admin/results',
  
  // 지원자
  CANDIDATE_TEST: '/candidate/test',
  CANDIDATE_RESULT: '/candidate/result',
  
  // 기타
  HOME: '/',
  PROFILE: '/profile',
} as const;

// API 엔드포인트
export const API_ENDPOINTS = {
  // 인증
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  
  // 사용자
  USERS: '/api/users',
  CANDIDATES: '/api/candidates',
  
  // 질문
  QUESTIONS: '/api/questions',
  
  // 테스트
  TEST_SESSIONS: '/api/test-sessions',
  START_TEST: '/api/test-sessions/start',
  SUBMIT_ANSWER: '/api/test-sessions/answer',
  FINISH_TEST: '/api/test-sessions/finish',
  
  // 평가
  EVALUATIONS: '/api/evaluations',
  LLM_EVALUATE: '/api/evaluations/llm',
  
  // 대시보드
  DASHBOARD_STATS: '/api/dashboard/stats',
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  INTERNAL_ERROR: '서버 오류가 발생했습니다.',
  CHEATING_DETECTED: '부정행위가 감지되어 시험이 종료됩니다.',
  TIME_EXPIRED: '시험 시간이 만료되었습니다.',
} as const;

// 성공 메시지
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '로그인에 성공했습니다.',
  REGISTER_SUCCESS: '회원가입에 성공했습니다.',
  SAVE_SUCCESS: '저장되었습니다.',
  DELETE_SUCCESS: '삭제되었습니다.',
  TEST_SUBMITTED: '답안이 제출되었습니다.',
  TEST_COMPLETED: '시험이 완료되었습니다.',
} as const; 