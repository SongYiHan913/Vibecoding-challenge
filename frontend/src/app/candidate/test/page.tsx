'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function TestPreparationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isAgreed, setIsAgreed] = useState(false);

  const handleStartTest = () => {
    // TODO: 나중에 실제 테스트 시작 로직 구현
    console.log('테스트 시작 (준비 중...)');
    alert('테스트 시작 기능은 준비 중입니다.');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            온라인 면접 시작 전 주의사항
          </h1>
          <p className="text-gray-600">
            {user?.name}님, 면접을 시작하기 전에 아래 내용을 반드시 확인해주세요.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 주요 주의사항 */}
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-lg">🚨</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  중요한 주의사항
                </h3>
                <p className="text-red-700 leading-relaxed">
                  온라인 면접을 시작한 후 <strong>웹 브라우저의 다른 탭으로 포커스가 이동</strong>하거나, 
                  <strong>다른 프로그램을 활성화</strong> 하면 <strong>시험이 강제 종료</strong>되며 
                  응답하지 않은 문제는 <strong>0점 처리</strong> 됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 추가 안내사항 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-900 mb-3">면접 진행 안내</h4>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                면접은 기술, 인성, 문제해결 능력을 평가하는 문제들로 구성됩니다.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                제한 시간은 총 90분이며, 남은 시간이 화면에 표시됩니다.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                답안은 자동으로 저장되며, 시간이 종료되면 자동 제출됩니다.
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                화면을 새로고침하거나 뒤로가기를 하지 마세요.
              </li>
            </ul>
          </div>

          {/* 기술적 요구사항 */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-3">권장 환경</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                안정적인 인터넷 연결 환경
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                Chrome, Firefox, Safari 최신 버전 브라우저 사용
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                조용하고 집중할 수 있는 환경
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                충분한 배터리 또는 전원 연결
              </li>
            </ul>
          </div>

          {/* 동의 체크박스 */}
          <div className="border-t pt-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                위의 모든 주의사항을 충분히 읽고 이해했으며, 
                <strong> 부정행위 방지 정책에 동의</strong>합니다.
              </span>
            </label>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-between items-center pt-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800"
            >
              이전으로
            </Button>
            
            <Button
              onClick={handleStartTest}
              variant="primary"
              disabled={!isAgreed}
              className={`px-8 py-3 text-lg font-medium ${
                isAgreed 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              면접 시작하기
            </Button>
          </div>

          {/* 하단 안내 */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              문제가 발생하면 관리자에게 문의하세요. 
              <br />
              면접 중에는 지원을 받을 수 없습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 