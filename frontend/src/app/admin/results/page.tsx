'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { API_ENDPOINTS } from '@/constants';
import { useAuthStore } from '@/store/authStore';

interface TestSession {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  appliedField: string;
  experience: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'terminated';
  startedAt: Date | null;
  completedAt: Date | null;
  terminatedAt: Date | null;
  terminationReason: string | null;
  totalTime: number;
  cheatingAttempts: number;
  focusLostCount: number;
  createdAt: Date;
  evaluation: {
    id: string;
    totalScore: number;
    technicalScore: number;
    personalityScore: number;
    problemSolvingScore: number;
    status: string;
  } | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    sessions: TestSession[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState('');
  const [candidateNameFilter, setCandidateNameFilter] = useState('');
  const [appliedFieldFilter, setAppliedFieldFilter] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [page, pageSize, statusFilter, candidateNameFilter, appliedFieldFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(candidateNameFilter && { candidateName: candidateNameFilter }),
        ...(appliedFieldFilter && { appliedField: appliedFieldFilter })
      });

      const response = await fetch(`${API_ENDPOINTS.TEST_SESSIONS}/admin/list?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('세션 조회 실패');
      }

      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setSessions(result.data.sessions);
        setTotalItems(result.data.pagination.total);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        console.error('세션 조회 실패:', result);
      }
    } catch (error) {
      console.error('세션 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const resetFilters = () => {
    setStatusFilter('');
    setCandidateNameFilter('');
    setAppliedFieldFilter('');
    setPage(1);
  };

  const handleViewDetail = (sessionId: string) => {
    router.push(`/admin/results/${sessionId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'not-started': { label: '미시작', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
      'in-progress': { label: '진행중', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      'completed': { label: '완료', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      'terminated': { label: '채점완료', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['not-started'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const getEvaluationBadge = (evaluation: TestSession['evaluation']) => {
    if (!evaluation) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          평가 대기
        </span>
      );
    }

    const score = evaluation.totalScore;
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';

    if (score >= 80) {
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
    } else if (score >= 60) {
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
    } else if (score >= 40) {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
    } else {
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {score.toFixed(1)}점
      </span>
    );
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, page - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">채점 관리</h1>
          <p className="text-gray-700 mt-1">
            테스트 세션 및 평가 결과를 관리합니다.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={resetFilters}
            variant="ghost"
            className="text-gray-900"
          >
            필터 초기화
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
          >
            새로고침
          </Button>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">검색 및 필터</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                지원자 이름
              </label>
              <Input
                type="text"
                placeholder="지원자 이름으로 검색"
                value={candidateNameFilter}
                onChange={(e) => setCandidateNameFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                테스트 상태
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">전체</option>
                <option value="not-started">미시작</option>
                <option value="in-progress">진행중</option>
                <option value="completed">완료</option>
                <option value="terminated">종료</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                지원 분야
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={appliedFieldFilter}
                onChange={(e) => setAppliedFieldFilter(e.target.value)}
              >
                <option value="">전체</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                페이지 크기
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                <option value={5}>5개</option>
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={50}>50개</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 테스트 세션 목록 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">테스트 세션 목록</h2>
            <span className="text-sm text-gray-700">
              총 {totalItems}개 ({((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalItems)})
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-900">조건에 맞는 테스트 세션이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      지원자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      분야
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      경력
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      테스트 상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      평가 결과
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      완료일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {session.candidateName}
                          </div>
                          <div className="text-sm text-gray-700">
                            {session.candidateEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {session.appliedField?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {session.experience}년
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEvaluationBadge(session.evaluation)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.completedAt
                          ? new Date(session.completedAt).toLocaleDateString('ko-KR')
                          : session.terminatedAt
                          ? new Date(session.terminatedAt).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {session.status === 'completed' ? (
                          <Button
                            onClick={() => handleViewDetail(session.id)}
                            variant="primary"
                            size="sm"
                          >
                            채점하기
                          </Button>
                        ) : session.status === 'terminated' ? (
                          <Button
                            onClick={() => handleViewDetail(session.id)}
                            variant="secondary"
                            size="sm"
                          >
                            결과 보기
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                          >
                            {session.status === 'not-started' ? '미시작' : '진행중'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* 페이지 크기 선택 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">페이지 크기:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5개</option>
                  <option value={10}>10개</option>
                  <option value={20}>20개</option>
                  <option value={50}>50개</option>
                </select>
              </div>

              {/* 페이지네이션 */}
              <div className="flex items-center space-x-2">
                {/* 이전 버튼 */}
                <Button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  variant="ghost"
                  size="sm"
                  className="text-gray-900"
                >
                  이전
                </Button>

                {/* 페이지 번호들 */}
                {getPageNumbers().map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    variant={page === pageNumber ? "primary" : "ghost"}
                    size="sm"
                    className={
                      page === pageNumber
                        ? "bg-blue-600 text-white"
                        : "text-gray-900 hover:bg-gray-100"
                    }
                  >
                    {pageNumber}
                  </Button>
                ))}

                {/* 다음 버튼 */}
                <Button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  variant="ghost"
                  size="sm"
                  className="text-gray-900"
                >
                  다음
                </Button>
              </div>

              {/* 페이지 정보 */}
              <div className="text-sm text-gray-900">
                {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalItems)} / {totalItems}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 