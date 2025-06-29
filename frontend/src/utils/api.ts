import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';
import { getFromLocalStorage, removeFromLocalStorage } from '@/utils';

// Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 토큰 가져오기
    const authData = getFromLocalStorage<{ token?: string }>('auth-storage');
    if (authData?.token) {
      config.headers.Authorization = `Bearer ${authData.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // 401 에러 시 로그아웃 처리
    if (error.response?.status === 401) {
      removeFromLocalStorage('auth-storage');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// API 응답 래퍼 함수
export const apiCall = async <T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await api(config);
    const backendResponse = response.data;
    
    // 백엔드 응답 구조: { success, data, message }
    return {
      success: backendResponse.success || true,
      data: backendResponse.data,
      message: backendResponse.message,
      error: backendResponse.success === false ? backendResponse.message : undefined
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// 인증 API
export const authAPI = {
  login: (email: string, password: string) =>
    apiCall({
      method: 'POST',
      url: '/api/auth/login',
      data: { email, password },
    }),

  register: (userData: any) =>
    apiCall({
      method: 'POST',
      url: '/api/auth/register',
      data: userData,
    }),

  logout: () =>
    apiCall({
      method: 'POST',
      url: '/api/auth/logout',
    }),

  me: () =>
    apiCall({
      method: 'GET',
      url: '/api/auth/me',
    }),
};

// 사용자 API
export const userAPI = {
  getUsers: (params?: any) =>
    apiCall({
      method: 'GET',
      url: '/api/users',
      params,
    }),

  getCandidates: (params?: any) =>
    apiCall({
      method: 'GET',
      url: '/api/candidates',
      params,
    }),

  getCandidate: (id: string) =>
    apiCall({
      method: 'GET',
      url: `/api/candidates/${id}`,
    }),

  updateCandidate: (id: string, data: any) =>
    apiCall({
      method: 'PUT',
      url: `/api/candidates/${id}`,
      data,
    }),

  deleteCandidate: (id: string) =>
    apiCall({
      method: 'DELETE',
      url: `/api/candidates/${id}`,
    }),
};

// 질문 API
export const questionAPI = {
  getQuestions: (params?: any) =>
    apiCall({
      method: 'GET',
      url: '/api/questions',
      params,
    }),

  getQuestion: (id: string) =>
    apiCall({
      method: 'GET',
      url: `/api/questions/${id}`,
    }),

  createQuestion: (data: any) =>
    apiCall({
      method: 'POST',
      url: '/api/questions',
      data,
    }),

  updateQuestion: (id: string, data: any) =>
    apiCall({
      method: 'PUT',
      url: `/api/questions/${id}`,
      data,
    }),

  deleteQuestion: (id: string) =>
    apiCall({
      method: 'DELETE',
      url: `/api/questions/${id}`,
    }),

  generateQuestions: (params: any) =>
    apiCall({
      method: 'POST',
      url: '/api/questions/generate',
      data: params,
    }),
};

// 테스트 세션 API
export const testAPI = {
  startTest: (candidateId: string) =>
    apiCall({
      method: 'POST',
      url: '/api/test-sessions/start',
      data: { candidateId },
    }),

  getTestSession: (sessionId: string) =>
    apiCall({
      method: 'GET',
      url: `/api/test-sessions/${sessionId}`,
    }),

  submitAnswer: (sessionId: string, questionId: string, answer: any) =>
    apiCall({
      method: 'POST',
      url: `/api/test-sessions/${sessionId}/answer`,
      data: { questionId, answer },
    }),

  finishTest: (sessionId: string) =>
    apiCall({
      method: 'POST',
      url: `/api/test-sessions/${sessionId}/finish`,
    }),

  getTestSessions: (params?: any) =>
    apiCall({
      method: 'GET',
      url: '/api/test-sessions',
      params,
    }),
};

// 평가 API
export const evaluationAPI = {
  getEvaluations: (params?: any) =>
    apiCall({
      method: 'GET',
      url: '/api/evaluations',
      params,
    }),

  getEvaluation: (id: string) =>
    apiCall({
      method: 'GET',
      url: `/api/evaluations/${id}`,
    }),

  createEvaluation: (data: any) =>
    apiCall({
      method: 'POST',
      url: '/api/evaluations',
      data,
    }),

  updateEvaluation: (id: string, data: any) =>
    apiCall({
      method: 'PUT',
      url: `/api/evaluations/${id}`,
      data,
    }),

  evaluateWithLLM: (evaluationId: string) =>
    apiCall({
      method: 'POST',
      url: `/api/evaluations/${evaluationId}/llm`,
    }),
};

// 대시보드 API
export const dashboardAPI = {
  getStats: () =>
    apiCall({
      method: 'GET',
      url: '/api/dashboard/stats',
    }),

  getRecentActivities: () =>
    apiCall({
      method: 'GET',
      url: '/api/dashboard/activities',
    }),
};

// 설정 API
export const configAPI = {
  getTestConfig: () =>
    apiCall({
      method: 'GET',
      url: '/api/config/test',
    }),

  updateTestConfig: (data: any) =>
    apiCall({
      method: 'PUT',
      url: '/api/config/test',
      data,
    }),
};

export default api; 