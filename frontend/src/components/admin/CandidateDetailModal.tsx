'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Candidate } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { API_ENDPOINTS } from '@/constants';

interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

interface CandidateDetail {
  id: string;
  email: string;
  name: string;
  phone: string;
  experience: number;
  appliedField: string;
  status: string;
  testSession?: {
    id: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    terminatedAt?: string;
    terminationReason?: string;
  };
  evaluation?: {
    totalScore: number;
    technicalScore: number;
    personalityScore: number;
    problemSolvingScore: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function CandidateDetailModal({ isOpen, onClose, candidate }: CandidateDetailModalProps) {
  const { token } = useAuthStore();
  const [candidateDetail, setCandidateDetail] = React.useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // 지원자 상세 정보 조회
  const fetchCandidateDetail = React.useCallback(async () => {
    if (!candidate || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.CANDIDATES}/${candidate.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch candidate detail');
      }

      const result = await response.json();
      
      if (result.success) {
        setCandidateDetail(result.data);
      }
    } catch (error) {
      console.error('Error fetching candidate detail:', error);
    } finally {
      setIsLoading(false);
    }
  }, [candidate, token]);

  React.useEffect(() => {
    if (isOpen && candidate) {
      fetchCandidateDetail();
    }
  }, [isOpen, candidate, fetchCandidateDetail]);

  if (!candidate) return null;

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="지원자 상세 정보">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : candidateDetail ? (
          <>
            {/* 기본 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">이름</label>
                  <p className="text-gray-800">{candidateDetail.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">이메일</label>
                  <p className="text-gray-800">{candidateDetail.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">전화번호</label>
                  <p className="text-gray-800">{candidateDetail.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">경력</label>
                  <p className="text-gray-800">{candidateDetail.experience}년</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">지원 분야</label>
                  <FieldBadge field={candidateDetail.appliedField} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">현재 상태</label>
                  <StatusBadge status={candidateDetail.status} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">등록일</label>
                  <p className="text-gray-800">
                    {new Date(candidateDetail.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">최종 수정일</label>
                  <p className="text-gray-800">
                    {new Date(candidateDetail.updatedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>

            {/* 테스트 세션 정보 */}
            {candidateDetail.testSession && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">테스트 세션 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">세션 ID</label>
                    <p className="text-gray-800 font-mono text-xs">{candidateDetail.testSession.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">테스트 상태</label>
                    <StatusBadge status={candidateDetail.testSession.status} />
                  </div>
                  {candidateDetail.testSession.startedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">시작 시간</label>
                      <p className="text-gray-800">
                        {new Date(candidateDetail.testSession.startedAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  )}
                  {candidateDetail.testSession.completedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">완료 시간</label>
                      <p className="text-gray-800">
                        {new Date(candidateDetail.testSession.completedAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  )}
                  {candidateDetail.testSession.terminatedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">종료 시간</label>
                      <p className="text-gray-800">
                        {new Date(candidateDetail.testSession.terminatedAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  )}
                  {candidateDetail.testSession.terminationReason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">종료 사유</label>
                      <p className="text-red-600 font-medium">
                        {candidateDetail.testSession.terminationReason === 'cheating' ? '부정행위 감지' :
                         candidateDetail.testSession.terminationReason === 'time-expired' ? '시간 만료' :
                         candidateDetail.testSession.terminationReason === 'technical-error' ? '기술적 오류' :
                         candidateDetail.testSession.terminationReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 평가 결과 */}
            {candidateDetail.evaluation && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">평가 결과</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {candidateDetail.evaluation.technicalScore}점
                    </div>
                    <div className="text-sm text-gray-700">기술 점수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {candidateDetail.evaluation.personalityScore}점
                    </div>
                    <div className="text-sm text-gray-700">인성 점수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {candidateDetail.evaluation.problemSolvingScore}점
                    </div>
                    <div className="text-sm text-gray-700">문제해결 점수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {candidateDetail.evaluation.totalScore}점
                    </div>
                    <div className="text-sm text-gray-700">총점</div>
                  </div>
                </div>
                
                {/* 점수 등급 */}
                <div className="mt-4 text-center">
                  <span className={`px-4 py-2 rounded-full font-medium ${
                    candidateDetail.evaluation.totalScore >= 90 ? 'bg-green-100 text-green-800' :
                    candidateDetail.evaluation.totalScore >= 80 ? 'bg-blue-100 text-blue-800' :
                    candidateDetail.evaluation.totalScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    candidateDetail.evaluation.totalScore >= 60 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {candidateDetail.evaluation.totalScore >= 90 ? '우수' :
                     candidateDetail.evaluation.totalScore >= 80 ? '양호' :
                     candidateDetail.evaluation.totalScore >= 70 ? '보통' :
                     candidateDetail.evaluation.totalScore >= 60 ? '미흡' : '불합격'}
                  </span>
                </div>
              </div>
            )}

            {/* 빈 상태 메시지 */}
            {!candidateDetail.testSession && !candidateDetail.evaluation && (
              <div className="text-center py-8">
                <p className="text-gray-700">아직 테스트를 시작하지 않았습니다.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-700">상세 정보를 불러올 수 없습니다.</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
                     <Button variant="ghost" onClick={onClose}>
             닫기
           </Button>
        </div>
      </div>
    </Modal>
  );
} 