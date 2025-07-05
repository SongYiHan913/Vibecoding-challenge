import { create } from 'zustand';
import { TestSession, Question, TestAnswer } from '@/types';

interface TestState {
  currentSession: TestSession | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  questions: Question[];
  answers: TestAnswer[];
  remainingTime: number;
  isTestActive: boolean;
  focusLostCount: number;
  isSubmitting: boolean;
  
  // Actions
  startTest: (sessionId: string, questions: Question[]) => void;
  setCurrentQuestion: (index: number) => void;
  submitAnswer: (questionId: string, answer: string | number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  pauseTest: () => void;
  resumeTest: () => void;
  finishTest: () => void;
  updateRemainingTime: (time: number) => void;
  incrementFocusLost: () => void;
  setFocusLostCount: (count: number) => void;
  setSubmitting: (submitting: boolean) => void;
  resetTest: () => void;
}

export const useTestStore = create<TestState>((set, get) => ({
  currentSession: null,
  currentQuestionIndex: 0,
  currentQuestion: null,
  questions: [],
  answers: [],
  remainingTime: 0,
  isTestActive: false,
  focusLostCount: 0,
  isSubmitting: false,

  startTest: (sessionId: string, questions: Question[]) => {
    const initialTime = 90 * 60; // 90분을 초로 변환

    set({
      currentSession: {
        id: sessionId,
        candidateId: '',
        status: 'in-progress',
        questions: questions.map(q => q.id),
        answers: [],
        remainingTime: initialTime,
        totalTime: initialTime,
        cheatingAttempts: 0,
        focusLostCount: 0,
      } as TestSession,
      questions,
      currentQuestionIndex: 0,
      currentQuestion: questions[0] || null,
      answers: [],
      remainingTime: initialTime,
      isTestActive: true,
      focusLostCount: 0,
    });
  },

  setCurrentQuestion: (index: number) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({
        currentQuestionIndex: index,
        currentQuestion: questions[index],
      });
    }
  },

  submitAnswer: (questionId: string, answer: string | number) => {
    const { answers, currentSession } = get();
    const existingAnswerIndex = answers.findIndex(a => a.questionId === questionId);
    const newAnswer: TestAnswer = {
      questionId,
      answer: typeof answer === 'number' ? answer : undefined,
      answerText: typeof answer === 'string' ? answer : undefined,
      answeredAt: new Date(),
      timeTaken: 0,
    };

    let updatedAnswers;
    if (existingAnswerIndex >= 0) {
      updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = newAnswer;
    } else {
      updatedAnswers = [...answers, newAnswer];
    }

    set({
      answers: updatedAnswers,
      currentSession: currentSession ? {
        ...currentSession,
        answers: updatedAnswers,
      } : null,
    });
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      get().setCurrentQuestion(currentQuestionIndex + 1);
    }
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      get().setCurrentQuestion(currentQuestionIndex - 1);
    }
  },

  pauseTest: () => {
    set({ isTestActive: false });
  },

  resumeTest: () => {
    set({ isTestActive: true });
  },

  finishTest: () => {
    set({
      isTestActive: false,
      currentSession: get().currentSession ? {
        ...get().currentSession!,
        status: 'completed',
        completedAt: new Date(),
      } : null,
    });
  },

  updateRemainingTime: (time: number) => {
    set({ remainingTime: time });
  },

  incrementFocusLost: () => {
    const { focusLostCount, currentSession } = get();
    const newCount = focusLostCount + 1;
    set({
      focusLostCount: newCount,
      currentSession: currentSession ? {
        ...currentSession,
        focusLostCount: newCount,
      } : null,
    });
  },

  setFocusLostCount: (count: number) => {
    const { currentSession } = get();
    set({
      focusLostCount: count,
      currentSession: currentSession ? {
        ...currentSession,
        focusLostCount: count,
      } : null,
    });
  },

  setSubmitting: (submitting: boolean) => {
    set({ isSubmitting: submitting });
  },

  resetTest: () => {
    set({
      currentSession: null,
      currentQuestionIndex: 0,
      currentQuestion: null,
      questions: [],
      answers: [],
      remainingTime: 0,
      isTestActive: false,
      focusLostCount: 0,
      isSubmitting: false,
    });
  },
})); 