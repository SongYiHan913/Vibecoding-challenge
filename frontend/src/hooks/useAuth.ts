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
        
        if (userData && userData.role) {
          login(userData);
          // 역할에 따라 리다이렉트
          if (userData.role === 'admin') {
            router.push(ROUTES.ADMIN_DASHBOARD);
          } else {
            router.push(ROUTES.CANDIDATE_TEST);
          }
          return { success: true };
        } else {
          console.error('사용자 데이터:', userData);
          return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
        }
      } else {
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      console.error('로그인 에러:', error);
      return { success: false, error: error.message };
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
        return { success: true, message: '회원가입이 완료되었습니다.' };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      router.push(ROUTES.LOGIN);
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