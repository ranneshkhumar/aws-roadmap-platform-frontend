import apiClient from './apiClient';

// ============================================================================
// 1. TYPE DEFINITIONS
// ============================================================================

export type UserRole = 'CORE' | 'CREW' | 'ENTHUSIAST';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  xp: number;
  streak: number;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

export interface LearningSlide {
  title: string;
  layoutType: 'TEXT_ONLY' | 'TEXT_IMAGE' | 'IMAGE_ONLY';
  imageUrl: string | null;
  bullets: string[];
  orderIndex: number;
}

export interface QuizQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: string; // Stride out for learner GET endpoints
  explanation: string;
  orderIndex: number;
}

export interface ModuleData {
  id: string;
  name: string;
  description: string;
  tier: string;
  xpPoints: number;
  estimatedMinutes: number;
  orderIndex: number;
  slug: string;
}

export interface ModuleDetail extends ModuleData {
  slides: LearningSlide[];
  questions: QuizQuestion[];
}

export interface CreateModuleDto {
  name: string;
  description: string;
  tier: string;
  xpPoints: number;
  estimatedMinutes: number;
  orderIndex?: number;
}

export interface UpdateModuleDto {
  name?: string;
  description?: string;
  tier?: string;
  xpPoints?: number;
  estimatedMinutes?: number;
  orderIndex?: number;
}

export interface UserProgress {
  currentXP: number;
  streak: number;
  completedModules: string[];
  unlockedModules: string[];
}

export interface ModuleProgress {
  status: 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
}

export interface QuizAttemptAnswer {
  questionOrder: number;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface QuizAttemptDto {
  answers: QuizAttemptAnswer[];
}

export interface QuizAttemptResult {
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  xpEarned: number;
}

// ============================================================================
// 2. ADAPTER LAYER
// ============================================================================

export const mapLayoutTypeToFrontend = (type: string): 'text-only' | 'text-image' | 'image-only' => {
  const map: Record<string, 'text-only' | 'text-image' | 'image-only'> = {
    TEXT_ONLY: 'text-only',
    TEXT_IMAGE: 'text-image',
    IMAGE_ONLY: 'image-only',
  };
  return map[type] || 'text-only';
};

export const mapLayoutTypeToBackend = (type: 'text-only' | 'text-image' | 'image-only'): 'TEXT_ONLY' | 'TEXT_IMAGE' | 'IMAGE_ONLY' => {
  const map: Record<'text-only' | 'text-image' | 'image-only', 'TEXT_ONLY' | 'TEXT_IMAGE' | 'IMAGE_ONLY'> = {
    'text-only': 'TEXT_ONLY',
    'text-image': 'TEXT_IMAGE',
    'image-only': 'IMAGE_ONLY',
  };
  return map[type] || 'TEXT_ONLY';
};

export const mapIndexToLetter = (idx: number): 'A' | 'B' | 'C' | 'D' => {
  const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  return letters[idx] || 'A';
};

export const mapLetterToIndex = (letter?: string): number => {
  if (!letter) return 0;
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
  return map[letter] ?? 0;
};

export const mapBackendQuestionToFrontend = (q: QuizQuestion): any => {
  return {
    question: q.question,
    options: [q.optionA, q.optionB, q.optionC, q.optionD],
    answerIndex: mapLetterToIndex(q.correctAnswer),
    explanation: q.explanation,
    orderIndex: q.orderIndex,
  };
};

export const mapFrontendQuestionToBackend = (q: any): QuizQuestion => {
  return {
    question: q.question,
    optionA: q.options[0] || '',
    optionB: q.options[1] || '',
    optionC: q.options[2] || '',
    optionD: q.options[3] || '',
    correctAnswer: mapIndexToLetter(q.answerIndex),
    explanation: q.explanation,
    orderIndex: q.orderIndex || 0,
  };
};

// ============================================================================
// 3. SERVICE METHODS
// ============================================================================

export const modulesService = {
  getModules: async (): Promise<ModuleData[]> => {
    const res = await apiClient.get<ModuleData[]>('/modules');
    return res.data;
  },

  getModule: async (id: string): Promise<ModuleDetail> => {
    const res = await apiClient.get<ModuleDetail>(`/modules/${id}`);
    return res.data;
  },

  getModuleBySlug: async (slug: string): Promise<ModuleDetail> => {
    const res = await apiClient.get<ModuleDetail>(`/modules/slug/${slug}`);
    return res.data;
  },

  createModule: async (dto: CreateModuleDto): Promise<ModuleData> => {
    const res = await apiClient.post<ModuleData>('/modules', dto);
    return res.data;
  },

  updateModule: async (id: string, dto: UpdateModuleDto): Promise<ModuleData> => {
    const res = await apiClient.patch<ModuleData>(`/modules/${id}`, dto);
    return res.data;
  },

  deleteModule: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ success: boolean }>(`/modules/${id}`);
    return res.data;
  },

  duplicateModule: async (id: string): Promise<ModuleDetail> => {
    const res = await apiClient.post<ModuleDetail>(`/modules/${id}/duplicate`);
    return res.data;
  },

  reorderModules: async (ids: string[]): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ success: boolean }>('/modules/reorder', { ids });
    return res.data;
  },
};

export const slidesService = {
  getSlides: async (moduleId: string): Promise<LearningSlide[]> => {
    const res = await apiClient.get<LearningSlide[]>(`/modules/${moduleId}/slides`);
    return res.data;
  },

  syncSlides: async (moduleId: string, slides: LearningSlide[]): Promise<LearningSlide[]> => {
    const res = await apiClient.put<LearningSlide[]>(`/modules/${moduleId}/slides`, { slides });
    return res.data;
  },
};

export const questionsService = {
  getQuestions: async (moduleId: string): Promise<QuizQuestion[]> => {
    const res = await apiClient.get<QuizQuestion[]>(`/modules/${moduleId}/questions`);
    return res.data;
  },

  syncQuestions: async (moduleId: string, questions: QuizQuestion[]): Promise<QuizQuestion[]> => {
    const res = await apiClient.put<QuizQuestion[]>(`/modules/${moduleId}/questions`, { questions });
    return res.data;
  },
};

export const progressService = {
  getMyProgress: async (): Promise<UserProgress> => {
    const res = await apiClient.get<UserProgress>('/progress/me');
    return res.data;
  },

  getModuleProgress: async (moduleId: string): Promise<ModuleProgress> => {
    const res = await apiClient.get<ModuleProgress>(`/modules/${moduleId}/progress`);
    return res.data;
  },

  submitQuizAttempt: async (moduleId: string, dto: QuizAttemptDto): Promise<QuizAttemptResult> => {
    const res = await apiClient.post<QuizAttemptResult>(`/modules/${moduleId}/quiz/attempt`, dto);
    return res.data;
  },
};
