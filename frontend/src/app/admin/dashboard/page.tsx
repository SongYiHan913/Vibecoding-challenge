'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { dashboardAPI, userAPI, questionAPI } from '@/utils/api';
import { ROUTES } from '@/constants';
import { DashboardStats } from '@/types';

interface RecentActivity {
  type: 'registration' | 'test_completed' | 'evaluation_completed';
  entityId: string;
  entityName: string;
  details: string;
  timestamp: Date;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    totalQuestions: 0,
    completedTests: 0,
    pendingEvaluations: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 대시보드 통계 데이터와 최근 활동을 병렬로 조회
      const [statsResponse, activitiesResponse] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities()
      ]);
      
      if (statsResponse.success) {
        const data = statsResponse.data as DashboardStats;
        setStats({
          totalCandidates: data.totalCandidates || 0,
          totalQuestions: data.totalQuestions || 0,
          completedTests: data.completedTests || 0,
          pendingEvaluations: data.pendingEvaluations || 0,
        });
      } else {
        console.error('통계 데이터 조회 실패:', statsResponse.message);
        // 기본값으로 설정
        setStats({
          totalCandidates: 0,
          totalQuestions: 0,
          completedTests: 0,
          pendingEvaluations: 0,
        });
      }

      if (activitiesResponse.success) {
        const activities = activitiesResponse.data as RecentActivity[];
        setRecentActivities(activities || []);
      } else {
        console.error('최근 활동 조회 실패:', activitiesResponse.message);
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('대시보드 데이터 조회 오류:', error);
      // 오류 시 기본값으로 설정
      setStats({
        totalCandidates: 0,
        totalQuestions: 0,
        completedTests: 0,
        pendingEvaluations: 0,
      });
      setRecentActivities([]);
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

  const navigateToPendingEvaluations = () => {
    router.push(`${ROUTES.ADMIN_RESULTS}?filter=pending-evaluation`);
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

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={navigateToResults}>
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

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={navigateToPendingEvaluations}>
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
          <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => {
                  const getActivityInfo = (type: string) => {
                    switch (type) {
                      case 'registration':
                        return { icon: '👤', color: 'text-blue-600', bgColor: 'bg-blue-100', label: '지원자 등록' };
                      case 'test_completed':
                        return { icon: '✅', color: 'text-green-600', bgColor: 'bg-green-100', label: '테스트 완료' };
                      case 'evaluation_completed':
                        return { icon: '📊', color: 'text-purple-600', bgColor: 'bg-purple-100', label: '평가 완료' };
                      default:
                        return { icon: '📋', color: 'text-gray-600', bgColor: 'bg-gray-100', label: '활동' };
                    }
                  };

                  const activityInfo = getActivityInfo(activity.type);

                  return (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`flex-shrink-0 w-8 h-8 ${activityInfo.bgColor} rounded-full flex items-center justify-center`}>
                        <span className={`text-sm ${activityInfo.color}`}>{activityInfo.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {activityInfo.label}: {activity.entityName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">{activity.details}</p>
                      </div>
                    </div>
                  );
                })}
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