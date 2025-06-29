import { create } from 'zustand';
import { TestSession, Question, TestAnswer } from '@/types';
import { Timer } from '@/utils';

interface TestState {
  currentSession: TestSession | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  questions: Question[];
  answers: TestAnswer[];
  timer: Timer | null;
  remainingTime: number;
  isTestActive: boolean;
  focusLostCount: number;
  isSubmitting: boolean;
  
  // Actions
  startTest: (session: TestSession, questions: Question[]) => void;
  setCurrentQuestion: (index: number) => void;
  submitAnswer: (questionId: string, answer: string | number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  pauseTest: () => void;
  resumeTest: () => void;
  finishTest: () => void;
  updateRemainingTime: (time: number) => void;
  incrementFocusLost: () => void;
  setSubmitting: (submitting: boolean) => void;
  resetTest: () => void;
}

export const useTestStore = create<TestState>((set, get) => ({
  currentSession: null,
  currentQuestionIndex: 0,
  currentQuestion: null,
  questions: [],
  answers: [],
  timer: null,
  remainingTime: 0,
  isTestActive: false,
  focusLostCount: 0,
  isSubmitting: false,

  startTest: (session: TestSession, questions: Question[]) => {
    const timer = new Timer(
      session.remainingTime,
      (time) => get().updateRemainingTime(time),
      () => get().finishTest()
    );

    set({
      currentSession: session,
      questions,
      currentQuestionIndex: 0,
      currentQuestion: questions[0] || null,
      answers: session.answers,
      timer,
      remainingTime: session.remainingTime,
      isTestActive: true,
      focusLostCount: session.focusLostCount,
    });

    timer.start();
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
      answer,
      answeredAt: new Date(),
      timeTaken: 0, // 실제로는 시작 시간부터 계산해야 함
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
    const { timer } = get();
    timer?.stop();
    set({ isTestActive: false });
  },

  resumeTest: () => {
    const { timer } = get();
    timer?.start();
    set({ isTestActive: true });
  },

  finishTest: () => {
    const { timer } = get();
    timer?.stop();
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

  setSubmitting: (submitting: boolean) => {
    set({ isSubmitting: submitting });
  },

  resetTest: () => {
    const { timer } = get();
    timer?.stop();
    set({
      currentSession: null,
      currentQuestionIndex: 0,
      currentQuestion: null,
      questions: [],
      answers: [],
      timer: null,
      remainingTime: 0,
      isTestActive: false,
      focusLostCount: 0,
      isSubmitting: false,
    });
  },
})); 