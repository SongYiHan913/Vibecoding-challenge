import { create } from 'zustand';
import { 
  Candidate, 
  Question, 
  Evaluation, 
  TestConfig, 
  DashboardStats,
  QuestionForm 
} from '@/types';

interface AdminState {
  // Dashboard
  dashboardStats: DashboardStats | null;
  
  // Candidates
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  
  // Questions
  questions: Question[];
  selectedQuestion: Question | null;
  questionFilters: {
    type?: string;
    difficulty?: string;
    experienceLevel?: string;
    field?: string;
  };
  
  // Evaluations
  evaluations: Evaluation[];
  selectedEvaluation: Evaluation | null;
  
  // Test Config
  testConfig: TestConfig | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingCandidates: boolean;
  isLoadingQuestions: boolean;
  isLoadingEvaluations: boolean;
  
  // Actions - Dashboard
  setDashboardStats: (stats: DashboardStats) => void;
  
  // Actions - Candidates
  setCandidates: (candidates: Candidate[]) => void;
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  removeCandidate: (id: string) => void;
  selectCandidate: (candidate: Candidate | null) => void;
  
  // Actions - Questions
  setQuestions: (questions: Question[]) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  selectQuestion: (question: Question | null) => void;
  setQuestionFilters: (filters: AdminState['questionFilters']) => void;
  getFilteredQuestions: () => Question[];
  
  // Actions - Evaluations
  setEvaluations: (evaluations: Evaluation[]) => void;
  addEvaluation: (evaluation: Evaluation) => void;
  updateEvaluation: (id: string, updates: Partial<Evaluation>) => void;
  selectEvaluation: (evaluation: Evaluation | null) => void;
  
  // Actions - Test Config
  setTestConfig: (config: TestConfig) => void;
  
  // Actions - Loading
  setLoading: (loading: boolean) => void;
  setLoadingCandidates: (loading: boolean) => void;
  setLoadingQuestions: (loading: boolean) => void;
  setLoadingEvaluations: (loading: boolean) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial state
  dashboardStats: null,
  candidates: [],
  selectedCandidate: null,
  questions: [],
  selectedQuestion: null,
  questionFilters: {},
  evaluations: [],
  selectedEvaluation: null,
  testConfig: null,
  isLoading: false,
  isLoadingCandidates: false,
  isLoadingQuestions: false,
  isLoadingEvaluations: false,

  // Dashboard actions
  setDashboardStats: (stats) => set({ dashboardStats: stats }),

  // Candidates actions
  setCandidates: (candidates) => set({ candidates }),
  
  addCandidate: (candidate) => {
    set({ candidates: [...get().candidates, candidate] });
  },
  
  updateCandidate: (id, updates) => {
    set({
      candidates: get().candidates.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  },
  
  removeCandidate: (id) => {
    set({
      candidates: get().candidates.filter(c => c.id !== id),
      selectedCandidate: get().selectedCandidate?.id === id 
        ? null 
        : get().selectedCandidate,
    });
  },
  
  selectCandidate: (candidate) => set({ selectedCandidate: candidate }),

  // Questions actions
  setQuestions: (questions) => set({ questions }),
  
  addQuestion: (question) => {
    set({ questions: [...get().questions, question] });
  },
  
  updateQuestion: (id, updates) => {
    set({
      questions: get().questions.map(q => 
        q.id === id ? { ...q, ...updates } : q
      ),
    });
  },
  
  removeQuestion: (id) => {
    set({
      questions: get().questions.filter(q => q.id !== id),
      selectedQuestion: get().selectedQuestion?.id === id 
        ? null 
        : get().selectedQuestion,
    });
  },
  
  selectQuestion: (question) => set({ selectedQuestion: question }),
  
  setQuestionFilters: (filters) => set({ questionFilters: filters }),
  
  getFilteredQuestions: () => {
    const { questions, questionFilters } = get();
    return questions.filter(question => {
      if (questionFilters.type && question.type !== questionFilters.type) {
        return false;
      }
      if (questionFilters.difficulty && question.difficulty !== questionFilters.difficulty) {
        return false;
      }
      if (questionFilters.experienceLevel && question.experienceLevel !== questionFilters.experienceLevel) {
        return false;
      }
      if (questionFilters.field && question.field !== questionFilters.field) {
        return false;
      }
      return true;
    });
  },

  // Evaluations actions
  setEvaluations: (evaluations) => set({ evaluations }),
  
  addEvaluation: (evaluation) => {
    set({ evaluations: [...get().evaluations, evaluation] });
  },
  
  updateEvaluation: (id, updates) => {
    set({
      evaluations: get().evaluations.map(e => 
        e.id === id ? { ...e, ...updates } : e
      ),
    });
  },
  
  selectEvaluation: (evaluation) => set({ selectedEvaluation: evaluation }),

  // Test Config actions
  setTestConfig: (config) => set({ testConfig: config }),

  // Loading actions
  setLoading: (loading) => set({ isLoading: loading }),
  setLoadingCandidates: (loading) => set({ isLoadingCandidates: loading }),
  setLoadingQuestions: (loading) => set({ isLoadingQuestions: loading }),
  setLoadingEvaluations: (loading) => set({ isLoadingEvaluations: loading }),
})); 