'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ROUTES } from '@/constants';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isCandidate } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // 현재 경로가 이미 admin이나 candidate 경로인지 확인
      const currentPath = window.location.pathname;
      
      if (isAdmin && !currentPath.startsWith('/admin')) {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else if (isCandidate && !currentPath.startsWith('/candidate')) {
        router.push(ROUTES.CANDIDATE_TEST);
      }
    }
  }, [isAuthenticated, isAdmin, isCandidate, router]);

  const handleLoginClick = () => {
    router.push(ROUTES.LOGIN);
  };

  const handleRegisterClick = () => {
    router.push(ROUTES.REGISTER);
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">리다이렉트 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            온라인 면접 시스템
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            개발자 기술 역량 및 인성을 종합적으로 평가하는 스마트한 면접 솔루션
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          <Card variant="shadow" className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900">지원자</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                온라인에서 간편하게 면접을 응시하고 실시간으로 결과를 확인하세요.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  기술 지식 평가
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  인성 검사
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  문제 해결 능력 측정
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  부정행위 방지 시스템
                </li>
              </ul>
              <Button 
                onClick={handleRegisterClick}
                className="w-full"
                variant="primary"
              >
                지원자 회원가입
              </Button>
            </CardContent>
          </Card>

          <Card variant="shadow" className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900">관리자</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                지원자 관리, 문제 출제, 평가 결과 분석을 효율적으로 수행하세요.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  지원자 관리 대시보드
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  문제 등록 및 관리
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  자동/수동 채점 시스템
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  LLM 기반 평가 지원
                </li>
              </ul>
              <Button 
                onClick={handleLoginClick}
                className="w-full"
                variant="success"
              >
                관리자 로그인
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">이미 계정이 있으신가요?</p>
          <Button 
            onClick={handleLoginClick}
            variant="ghost"
            size="lg"
          >
            로그인
          </Button>
        </div>
      </div>
    </div>
  );
}
