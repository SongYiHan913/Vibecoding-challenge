import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';
import { getFromLocalStorage, removeFromLocalStorage } from '@/utils';

// Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 5000, // 5초로 단축
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // Zustand persist에서 토큰 가져오기
    const authStorage = getFromLocalStorage<{ state?: { token?: string } }>('auth-storage');
    const token = authStorage?.state?.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // 인증 관련 API 호출이 아닌 경우에만 401 에러 시 자동 로그아웃 처리
    const isAuthAPI = error.config?.url?.includes('/api/auth/login') || 
                      error.config?.url?.includes('/api/auth/register');
    
    if (error.response?.status === 401 && !isAuthAPI) {
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
    const errorCode = error.status;

    var errorReturn = {
      success: false,
      message: error.message,
      error: error.error
    };

    if (errorCode) {
      switch (errorCode) {
        case 401:
          errorReturn.message = "토큰이 없거나, ID/PWD 가 일치하지 않습니다."
          break;
        case 403:
          errorReturn.message = "권한이 없습니다."
          break;
        case 404:
          errorReturn.message = "요청한 리소스를 찾을 수 없습니다."
          break;
        case 500:
          errorReturn.message = "서버 오류가 발생했습니다."
          break;
        default:
          errorReturn.message = "알 수 없는 오류가 발생했습니다."
          break;
      }
      return errorReturn;
    }
    return errorReturn;
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

  // JSON 파일 업로드
  uploadQuestions: (file: File) => {
    const formData = new FormData();
    formData.append('questions', file);
    
    return apiCall({
      method: 'POST',
      url: '/api/questions/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

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