'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { dashboardAPI, userAPI, questionAPI } from '@/utils/api';
import { ROUTES } from '@/constants';

interface DashboardStats {
  totalCandidates: number;
  totalQuestions: number;
  completedTests: number;
  pendingEvaluations: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    totalQuestions: 0,
    completedTests: 0,
    pendingEvaluations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 지원자 수 조회
      const candidatesResponse = await userAPI.getCandidates({ page: 1, limit: 1 });
      
      // 질문 수 조회
      const questionsResponse = await questionAPI.getQuestions({ page: 1, limit: 1 });
      
      setStats({
        totalCandidates: (candidatesResponse.data as any)?.pagination?.total || 0,
        totalQuestions: (questionsResponse.data as any)?.pagination?.total || 0,
        completedTests: 0, // 추후 testAPI에서 조회
        pendingEvaluations: 0, // 추후 evaluationAPI에서 조회
      });
    } catch (error) {
      console.error('대시보드 데이터 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToQuestions = () => {
    router.push(ROUTES.ADMIN_QUESTIONS);
  };

  const navigateToCandidates = () => {
    router.push(ROUTES.ADMIN_CANDIDATES);
  };

  const navigateToResults = () => {
    router.push(ROUTES.ADMIN_RESULTS);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={navigateToCandidates}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 지원자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalCandidates.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={navigateToQuestions}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">📝</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">등록된 질문</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.totalQuestions.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">완료된 테스트</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.completedTests.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={navigateToResults}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-medium">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">대기 중인 평가</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.pendingEvaluations.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">빠른 액션</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={navigateToQuestions}
              variant="primary"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <span className="text-2xl">📁</span>
              <span>질문 업로드</span>
            </Button>
            
            <Button
              onClick={navigateToCandidates}
              variant="secondary"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <span className="text-2xl">👥</span>
              <span>지원자 관리</span>
            </Button>
            
            <Button
              onClick={navigateToResults}
              variant="ghost"
              className="h-20 flex flex-col items-center justify-center space-y-2 border-2 border-dashed border-gray-300 hover:border-gray-400"
            >
              <span className="text-2xl">📊</span>
              <span>평가 결과</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900" >최근 활동</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>최근 활동이 없습니다.</p>
                <p className="text-sm mt-1">지원자가 등록되거나 테스트를 완료하면 여기에 표시됩니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 시스템 정보 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">시스템 정보</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">시스템 상태</p>
              <p className="text-lg font-semibold text-green-600">정상 운영 중</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">마지막 업데이트</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 