'use client';

import React from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { Candidate } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/common/Loading';
import { CandidateDetailModal } from '../../../components/admin/CandidateDetailModal';
import { API_ENDPOINTS } from '@/constants';

export default function CandidatesPage() {
  const { token } = useAuthStore();
  const {
    candidates,
    setCandidates,
    isLoadingCandidates,
    setLoadingCandidates,
    selectedCandidate,
    selectCandidate,
    updateCandidate
  } = useAdminStore();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [fieldFilter, setFieldFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  // 지원자 목록 조회
  const fetchCandidates = React.useCallback(async () => {
    if (!token) return;

    setLoadingCandidates(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (fieldFilter) params.append('appliedField', fieldFilter);

      const response = await fetch(`${API_ENDPOINTS.CANDIDATES}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const result = await response.json();
      
      if (result.success) {
        setCandidates(result.data.candidates);
        setTotalPages(result.data.pagination.totalPages);
        setTotalItems(result.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoadingCandidates(false);
    }
  }, [token, page, searchTerm, statusFilter, fieldFilter, pageSize, setCandidates, setLoadingCandidates]);

  // 페이징 함수들
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1); // 페이지 크기 변경 시 첫 페이지로
  };

  // 페이지 번호 배열 생성
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

  // 지원자 상세 조회
  const handleViewDetail = (candidate: Candidate) => {
    selectCandidate(candidate);
    setIsDetailModalOpen(true);
  };

  // 상태 표시 컴포넌트
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      pending: { label: '대기', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
      testing: { label: '테스트 중', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      completed: { label: '완료', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      evaluated: { label: '평가 완료', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  // 지원 분야 표시 컴포넌트
  const FieldBadge = ({ field }: { field: string }) => {
    const fieldConfig = {
      java: { label: 'Java/MariaDB', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
      csharp: { label: 'C#/MSSQL', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    };

    const config = fieldConfig[field as keyof typeof fieldConfig] || fieldConfig.java;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  React.useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // 검색 및 필터 변경 시 첫 페이지로 이동
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, fieldFilter]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">지원자 관리</h1>
          <p className="text-gray-700 mt-1">
            지원자 목록을 조회하고 상태를 관리합니다.
          </p>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              검색
            </label>
            <Input
              type="text"
              placeholder="이름 또는 이메일로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              상태
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">전체</option>
              <option value="pending">대기</option>
              <option value="testing">테스트 중</option>
              <option value="completed">완료</option>
              <option value="evaluated">평가 완료</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              지원 분야
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
            >
              <option value="">전체</option>
              <option value="java">Java/MariaDB</option>
              <option value="csharp">C#/MSSQL</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={fetchCandidates}
              className="w-full"
              disabled={isLoadingCandidates}
            >
              {isLoadingCandidates ? '검색 중...' : '검색'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 지원자 목록 */}
      {isLoadingCandidates ? (
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    지원자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    경력/분야
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-700">
                      등록된 지원자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.name}
                          </div>
                          <div className="text-sm text-gray-700">
                            {candidate.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {candidate.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {candidate.experience}년 경력
                          </div>
                          <FieldBadge field={candidate.appliedField} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={candidate.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(candidate.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(candidate)}
                        >
                          상세보기
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 - 질문 관리와 동일한 형태 */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-white">
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
          )}
        </Card>
      )}

      {/* 지원자 상세 모달 */}
      <CandidateDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          selectCandidate(null);
        }}
        candidate={selectedCandidate}
      />
    </div>
  );
} 