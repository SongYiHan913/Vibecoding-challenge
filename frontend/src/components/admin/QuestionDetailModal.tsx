'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Question } from '@/types';

interface QuestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  onDelete?: (questionId: string) => void;
}

export default function QuestionDetailModal({
  isOpen,
  onClose,
  question,
  onDelete,
}: QuestionDetailModalProps) {
  if (!question) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'technical':
        return '기술';
      case 'personality':
        return '인성';
      case 'problem-solving':
        return '문제해결';
      default:
        return type;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return difficulty;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'multiple-choice':
        return '객관식';
      case 'essay':
        return '주관식';
      default:
        return format;
    }
  };

  const getExperienceLevelLabel = (level: string) => {
    switch (level) {
      case 'junior':
        return '주니어 (5년 이하)';
      case 'senior':
        return '시니어 (5년 이상)';
      default:
        return level || '정보 없음';
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('정말로 이 질문을 삭제하시겠습니까?')) {
      onDelete(question.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="질문 상세 정보"
      size="lg"
    >
      <div className="space-y-4">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              질문 타입
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {getTypeLabel(question.type)}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              질문 형식
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {getFormatLabel(question.format)}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              난이도
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {getDifficultyLabel(question.difficulty)}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              경력 수준
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {getExperienceLevelLabel(question.experienceLevel)}
            </div>
          </div>
          
          {question.field && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                기술 분야
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                {question.field.toUpperCase()}
              </div>
            </div>
          )}
          
          {question.category && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                카테고리
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                {question.category}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              점수
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {question.points}점
            </div>
          </div>
        </div>

        {/* 질문 내용 */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            질문 내용
          </label>
          <div className="px-4 py-3 bg-gray-50 rounded-md whitespace-pre-wrap text-gray-900">
            {question.question}
          </div>
        </div>

        {/* 객관식 선택지 */}
        {question.format === 'multiple-choice' && question.options && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              선택지
            </label>
            <div className="space-y-2">
              {question.options.map((option, index) => {
                const isCorrect = question.correctAnswer === index;
                
                return (
                  <div
                    key={index}
                    className={`px-4 py-3 rounded-md text-gray-900 ${
                      isCorrect
                        ? 'bg-green-50 border-2 border-green-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 mr-2">
                        {index + 1}.
                      </span>
                      <span className="flex-1">{option}</span>
                      {isCorrect && (
                        <span className="text-green-600 font-medium text-sm">
                          ✓ 정답
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 주관식 정답 */}
        {question.format === 'essay' && (
          <>
            {question.correctAnswerText && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  모범 답안
                </label>
                <div className="px-4 py-3 bg-green-50 rounded-md whitespace-pre-wrap text-gray-900">
                  {question.correctAnswerText}
                </div>
              </div>
            )}
            
            {question.requiredKeywords && question.requiredKeywords.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  필수 키워드
                </label>
                <div className="flex flex-wrap gap-2">
                  {question.requiredKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 메타 정보 */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-900">
            <div>
              <span className="font-medium">생성일:</span>{' '}
              {new Date(question.createdAt).toLocaleString('ko-KR')}
            </div>
            <div>
              <span className="font-medium">수정일:</span>{' '}
              {new Date(question.updatedAt).toLocaleString('ko-KR')}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button onClick={onClose} variant="ghost">
            닫기
          </Button>
          {onDelete && (
            <Button onClick={handleDelete} variant="danger">
              삭제
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
} 