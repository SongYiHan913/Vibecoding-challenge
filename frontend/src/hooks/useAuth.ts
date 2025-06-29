import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/utils/api';
import { User } from '@/types';
import { ROUTES } from '@/constants';

export const useAuth = () => {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setLoading,
    updateUser,
    isAdmin,
    isCandidate,
  } = useAuthStore();

  // 로그인
  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data) {
        // 이제 response.data는 { user, token } 구조
        const loginData = response.data as any;
        const userData = loginData.user;
        const token = loginData.token;
        
        if (userData && userData.role && token) {
          login(userData, token);
          return { success: true, user: userData };
        } else {
          return { success: false, error: '사용자 정보 또는 토큰을 찾을 수 없습니다.' };
        }
      } else {
        // API 호출이 실패한 경우
        const errorMessage = response.error || response.message || '로그인에 실패했습니다.';
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      return { success: false, error: error.message || '로그인 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  };

  // 회원가입
  const handleRegister = async (userData: any) => {
    setLoading(true);
    try {
      const response = await authAPI.register(userData);
      
      if (response.success) {
        return { success: true, message: response.message || '회원가입이 완료되었습니다.' };
      } else {
        const errorMessage = response.error || response.message || '회원가입에 실패했습니다.';
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      return { success: false, error: error.message || '회원가입 중 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // 로그아웃 에러는 무시하고 진행
    } finally {
      logout();
      router.push(ROUTES.HOME);
    }
  };

  // 사용자 정보 갱신
  const refreshUser = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await authAPI.me();
      if (response.success && response.data) {
        updateUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // 권한 검사
  const requireAuth = (requiredRole?: 'admin' | 'candidate') => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return false;
    }

    if (requiredRole && user?.role !== requiredRole) {
      // 권한이 없는 경우 적절한 페이지로 리다이렉트
      if (user?.role === 'admin') {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else {
        router.push(ROUTES.CANDIDATE_TEST);
      }
      return false;
    }

    return true;
  };

  // 관리자 권한 검사
  const requireAdmin = () => requireAuth('admin');

  // 지원자 권한 검사
  const requireCandidate = () => requireAuth('candidate');

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: isAdmin(),
    isCandidate: isCandidate(),
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
    requireAuth,
    requireAdmin,
    requireCandidate,
  };
}; 