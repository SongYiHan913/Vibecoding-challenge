'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants';

interface CandidateLayoutProps {
  children: React.ReactNode;
}

export default function CandidateLayout({ children }: CandidateLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthenticated || user?.role !== 'candidate') {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push(ROUTES.HOME);
  };

  if (!isAuthenticated || user?.role !== 'candidate') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 간단한 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                온라인 면접 시스템
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.name}님
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 