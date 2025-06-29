'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { questionAPI } from '@/utils/api';
import { Question, QuestionType, QuestionFormat, Difficulty, ExperienceLevel } from '@/types';
import { QUESTION_TYPES, QUESTION_FORMATS, DIFFICULTIES, EXPERIENCE_LEVELS } from '@/constants';
import QuestionDetailModal from '@/components/admin/QuestionDetailModal';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '' as QuestionType | '',
    format: '' as QuestionFormat | '',
    difficulty: '' as Difficulty | '',
    experienceLevel: '' as ExperienceLevel | '',
    field: '' as 'java' | 'csharp' | 'common' | '',
  });

  // 질문 목록 조회
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getQuestions({
        search: searchTerm,
        ...filters,
      });
      
      if (response.success && response.data) {
        // 백엔드에서 data.questions 형태로 응답을 보내므로 이를 처리
        const apiData = response.data as any;
        const questionsData = apiData.questions || apiData;
        const questionsArray = Array.isArray(questionsData) ? questionsData : [];
        setQuestions(questionsArray);
        console.log('✅ 질문 데이터 로드 성공:', questionsArray.length, '개');
      } else {
        // API 응답이 실패하거나 데이터가 없으면 빈 배열로 설정
        setQuestions([]);
        console.log('❌ 질문 데이터 없음 또는 실패');
      }
    } catch (error) {
      console.error('❌ 질문 조회 오류:', error);
      console.error('요청 필터:', { searchTerm, filters });
      // 오류 발생 시에도 빈 배열로 설정하여 안전하게 처리
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [searchTerm, filters]);

  // JSON 파일 업로드
  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert('업로드할 파일을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await questionAPI.uploadQuestions(uploadFile);
      
      if (response.success) {
        alert('질문이 성공적으로 업로드되었습니다.');
        setShowUploadModal(false);
        setUploadFile(null);
        fetchQuestions();
      } else {
        alert(`업로드 실패: ${response.error}`);
      }
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 질문 삭제
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('정말로 이 질문을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await questionAPI.deleteQuestion(questionId);
      
      if (response.success) {
        alert('질문이 삭제되었습니다.');
        fetchQuestions();
      } else {
        alert(`삭제 실패: ${response.error}`);
      }
    } catch (error) {
      console.error('질문 삭제 오류:', error);
      alert('질문 삭제 중 오류가 발생했습니다.');
    }
  };

  // 필터 리셋
  const resetFilters = () => {
    setFilters({
      type: '',
      format: '',
      difficulty: '',
      experienceLevel: '',
      field: '',
    });
    setSearchTerm('');
  };

  // 질문 상세보기
  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setShowDetailModal(true);
  };

  // 질문 상세 모달에서 삭제
  const handleQuestionDeleteFromModal = async (questionId: string) => {
    try {
      const response = await questionAPI.deleteQuestion(questionId);
      
      if (response.success) {
        alert('질문이 삭제되었습니다.');
        setShowDetailModal(false);
        setSelectedQuestion(null);
        fetchQuestions();
      } else {
        alert(`삭제 실패: ${response.error}`);
      }
    } catch (error) {
      console.error('질문 삭제 오류:', error);
      alert('질문 삭제 중 오류가 발생했습니다.');
    }
  };

  // 타입별 색상 설정
  const getTypeColor = (type: QuestionType) => {
    switch (type) {
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'personality':
        return 'bg-green-100 text-green-800';
      case 'problem-solving':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 난이도별 색상 설정
  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">질문 관리</h1>
        <Button
          onClick={() => setShowUploadModal(true)}
          variant="primary"
          className="bg-blue-600 hover:bg-blue-700"
        >
          📁 JSON 파일 업로드
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">검색 및 필터</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                검색
              </label>
              <Input
                type="text"
                placeholder="질문 내용 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                타입
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value as QuestionType | ''})}
              >
                <option value="">전체</option>
                <option value={QUESTION_TYPES.TECHNICAL}>기술</option>
                <option value={QUESTION_TYPES.PERSONALITY}>인성</option>
                <option value={QUESTION_TYPES.PROBLEM_SOLVING}>문제해결</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                형식
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={filters.format}
                onChange={(e) => setFilters({...filters, format: e.target.value as QuestionFormat | ''})}
              >
                <option value="">전체</option>
                <option value={QUESTION_FORMATS.MULTIPLE_CHOICE}>객관식</option>
                <option value={QUESTION_FORMATS.ESSAY}>주관식</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                난이도
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={filters.difficulty}
                onChange={(e) => setFilters({...filters, difficulty: e.target.value as Difficulty | ''})}
              >
                <option value="">전체</option>
                <option value={DIFFICULTIES.EASY}>쉬움</option>
                <option value={DIFFICULTIES.MEDIUM}>보통</option>
                <option value={DIFFICULTIES.HARD}>어려움</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                경력 수준
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={filters.experienceLevel}
                onChange={(e) => setFilters({...filters, experienceLevel: e.target.value as ExperienceLevel | ''})}
              >
                <option value="">전체</option>
                <option value={EXPERIENCE_LEVELS.JUNIOR}>주니어</option>
                <option value={EXPERIENCE_LEVELS.SENIOR}>시니어</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                분야
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={filters.field}
                onChange={(e) => setFilters({...filters, field: e.target.value as 'java' | 'csharp' | 'common' | ''})}
              >
                <option value="">전체</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="common">공통</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <Button
              onClick={resetFilters}
              variant="ghost"
              className="text-gray-900 hover:text-black"
            >
              필터 초기화
            </Button>
            <span className="text-sm text-gray-900">
              총 {questions.length}개의 질문
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 질문 목록 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-900">로딩 중...</p>
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-900">등록된 질문이 없습니다.</p>
              <Button
                onClick={() => setShowUploadModal(true)}
                variant="primary"
                className="mt-4"
              >
                질문 업로드하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          Array.isArray(questions) && questions.map((question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleQuestionClick(question)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(question.type)}`}>
                        {question.type === 'technical' ? '기술' : 
                         question.type === 'personality' ? '인성' : '문제해결'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty === 'easy' ? '쉬움' : 
                         question.difficulty === 'medium' ? '보통' : '어려움'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-black rounded-full text-xs font-medium">
                        {question.experienceLevel === 'junior' ? '주니어' : '시니어'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-black rounded-full text-xs font-medium">
                        {question.format === 'multiple-choice' ? '객관식' : '주관식'}
                      </span>
                      {question.field && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {question.field.toUpperCase()}
                        </span>
                      )}
                      {question.category && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {question.category}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2 hover:text-blue-600">
                      {question.question.length > 100 
                        ? `${question.question.substring(0, 100)}...` 
                        : question.question}
                    </h3>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-900">
                      <span>점수: {question.points}점</span>
                      <span>생성일: {new Date(question.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(question.id);
                      }}
                      variant="danger"
                      size="sm"
                      className="text-black hover:text-gray-800"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 파일 업로드 모달 */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="질문 JSON 파일 업로드"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              JSON 파일 선택
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="text-xs text-gray-900 mt-1">
              질문 배열이 포함된 JSON 파일을 업로드하세요.
            </p>
          </div>
          
          {uploadFile && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-900">
                선택된 파일: {uploadFile.name}
              </p>
              <p className="text-xs text-gray-900">
                크기: {(uploadFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setShowUploadModal(false)}
              variant="ghost"
            >
              취소
            </Button>
            <Button
              onClick={handleFileUpload}
              variant="primary"
              disabled={!uploadFile || loading}
            >
              {loading ? '업로드 중...' : '업로드'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 질문 상세 정보 모달 */}
      <QuestionDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedQuestion(null);
        }}
        question={selectedQuestion}
        onDelete={handleQuestionDeleteFromModal}
      />
    </div>
  );
} 