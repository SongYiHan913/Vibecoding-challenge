'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { ROUTES } from '@/constants';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // 인증 상태 확인을 위한 짧은 지연
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      if (!isAuthenticated || user?.role !== 'admin') {
        router.push(ROUTES.LOGIN);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push(ROUTES.HOME);
  };

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoading ? '로딩 중...' : '리다이렉트 중...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href={ROUTES.ADMIN_DASHBOARD} className="text-xl font-bold text-gray-900">
                관리자 시스템
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.name}님 환영합니다
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 - 고정 너비 유지 */}
        <nav className="min-w-64 w-64 flex-shrink-0 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href={ROUTES.ADMIN_DASHBOARD}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  📊 대시보드
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ADMIN_CANDIDATES}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  👥 지원자 관리
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ADMIN_QUESTIONS}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  📝 질문 관리
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ADMIN_RESULTS}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  📋 평가 결과
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* 메인 컨텐츠 - 반응형 지원 */}
        <main className="flex-1 min-w-0 p-8 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 