import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ROADMAP_MODULES, ModuleData, QuizQuestion, LearningSlide } from '@/constants/roadmapData';
import { generateQuizQuestionsForModule } from '@/lib/quizHelpers';

export interface UserResourceProgress {
  userId: string;
  moduleId: string;
  completed: boolean;
  completedAt: string;
}

export interface QuizQuestionReview {
  question: string;
  options: string[];
  userAnswerIndex: number;
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizReviewData {
  moduleId: string;
  score: number;
  totalQuestions: number;
  xpEarned: number;
  percentage: number;
  answers: QuizQuestionReview[];
  completedAt: string;
}

export interface RoadmapStore {
  modules: ModuleData[];
  moduleStates: { [key: string]: 'completed' | 'current' | 'locked' };
  xp: number;
  streak: number;
  userResourceProgress: { [moduleId: string]: UserResourceProgress };
  quizReviews: { [moduleId: string]: QuizReviewData };
  addModule: (name: string, description: string, level: 'Beginner' | 'Intermediate' | 'Advanced', estimatedTime: string, points: number) => void;
  updateModule: (moduleId: string, updatedFields: Partial<ModuleData>) => void;
  deleteModule: (moduleId: string) => void;
  duplicateModule: (moduleId: string) => void;
  reorderModule: (moduleId: string, direction: 'up' | 'down') => void;
  completeModule: (moduleId: string, points: number) => void;
  markAsRead: (moduleId: string) => void;
  submitQuizScore: (moduleId: string, score: number, answers: QuizQuestionReview[], xpEarned: number) => void;
  resetProgress: () => void;
}

const getInitialModules = (): ModuleData[] => {
  return ROADMAP_MODULES.map((mod) => ({
    ...mod,
    quizQuestions: mod.quizQuestions || generateQuizQuestionsForModule(mod.id, mod.name),
  }));
};

const getInitialModuleStates = (modulesList: ModuleData[]) => {
  const states: { [key: string]: 'completed' | 'current' | 'locked' } = {};
  modulesList.forEach((mod, idx) => {
    if (idx < 3) {
      states[mod.id] = 'completed'; // First 3 completed (Fundamentals, EC2, S3)
    } else if (idx === 3) {
      states[mod.id] = 'current'; // 4th current (IAM)
    } else {
      states[mod.id] = 'locked'; // Rest locked
    }
  });
  return states;
};

export const useRoadmapStore = create<RoadmapStore>()(
  persist(
    (set) => ({
      modules: getInitialModules(),
      moduleStates: getInitialModuleStates(getInitialModules()),
      xp: 1250,
      streak: 7,
      userResourceProgress: {},
      quizReviews: {},
      
      addModule: (name, description, level, estimatedTime, points) =>
        set((state) => {
          // Generate unique slug ID from name
          const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
          let finalId = baseId || 'module';
          let counter = 1;
          while (state.modules.some((m) => m.id === finalId)) {
            finalId = `${baseId}_${counter}`;
            counter++;
          }

          const newModule: ModuleData = {
            id: finalId,
            name,
            points,
            level,
            description,
            iconName: 'Boxes',
            estimatedTime,
            learningPagesCount: 1,
            quizQuestionsCount: 1,
            tasks: [`Learn about ${name}.`],
            quiz: {
              question: `What is the primary purpose of ${name}?`,
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              answerIndex: 0,
              explanation: 'Default explanation.'
            },
            learningContent: [
              { 
                title: `Welcome to ${name}`, 
                content: [`This is the default learning page for ${name}. Edit it using the CMS Content Editor.`],
                layoutType: 'text-only'
              }
            ],
            quizQuestions: [
              {
                question: `What is the primary purpose of ${name}?`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                answerIndex: 0,
                explanation: 'Default explanation.'
              }
            ]
          };

          const nextModules = [...state.modules, newModule];
          const nextStates = { ...state.moduleStates };
          nextStates[finalId] = 'locked';

          return {
            modules: nextModules,
            moduleStates: nextStates,
          };
        }),

      updateModule: (moduleId, updatedFields) =>
        set((state) => {
          const nextModules = state.modules.map((m) => {
            if (m.id === moduleId) {
              return { ...m, ...updatedFields };
            }
            return m;
          });
          return { modules: nextModules };
        }),

      deleteModule: (moduleId) =>
        set((state) => {
          const nextModules = state.modules.filter((m) => m.id !== moduleId);
          const nextStates = { ...state.moduleStates };
          delete nextStates[moduleId];
          return {
            modules: nextModules,
            moduleStates: nextStates,
          };
        }),

      duplicateModule: (moduleId) =>
        set((state) => {
          const target = state.modules.find((m) => m.id === moduleId);
          if (!target) return {};

          const baseId = `${target.id}_copy`;
          let finalId = baseId;
          let counter = 1;
          while (state.modules.some((m) => m.id === finalId)) {
            finalId = `${baseId}_${counter}`;
            counter++;
          }

          const duplicated: ModuleData = {
            ...target,
            id: finalId,
            name: `${target.name} Copy`,
            learningContent: target.learningContent.map((slide) => ({ ...slide })),
            quizQuestions: target.quizQuestions ? target.quizQuestions.map((q) => ({ ...q })) : undefined,
          };

          const nextModules = [...state.modules, duplicated];
          const nextStates = { ...state.moduleStates };
          nextStates[finalId] = 'locked';

          return {
            modules: nextModules,
            moduleStates: nextStates,
          };
        }),

      reorderModule: (moduleId, direction) =>
        set((state) => {
          const modulesCopy = [...state.modules];
          const index = modulesCopy.findIndex((m) => m.id === moduleId);
          if (index === -1) return {};
          
          const level = modulesCopy[index].level;
          const sameLevelIndices = modulesCopy
            .map((m, idx) => (m.level === level ? idx : -1))
            .filter((idx) => idx !== -1);
            
          const positionInLevel = sameLevelIndices.indexOf(index);
          
          if (direction === 'up' && positionInLevel > 0) {
            const prevIndex = sameLevelIndices[positionInLevel - 1];
            const temp = modulesCopy[index];
            modulesCopy[index] = modulesCopy[prevIndex];
            modulesCopy[prevIndex] = temp;
          } else if (direction === 'down' && positionInLevel < sameLevelIndices.length - 1) {
            const nextIndex = sameLevelIndices[positionInLevel + 1];
            const temp = modulesCopy[index];
            modulesCopy[index] = modulesCopy[nextIndex];
            modulesCopy[nextIndex] = temp;
          }
          
          return { modules: modulesCopy };
        }),

      completeModule: (moduleId, points) =>
        set((state) => {
          const nextStates = { ...state.moduleStates };
          nextStates[moduleId] = 'completed';

          // Identify the next module in the sequence and unlock it
          const seq = state.modules.map((m) => m.id);
          const currentIdx = seq.indexOf(moduleId);
          
          if (currentIdx !== -1 && currentIdx + 1 < seq.length) {
            const nextModuleId = seq[currentIdx + 1];
            // Only unlock if it was previously locked
            if (nextStates[nextModuleId] === 'locked') {
              nextStates[nextModuleId] = 'current';
            }
          }

          return {
            moduleStates: nextStates,
            xp: state.xp + points,
          };
        }),

      markAsRead: (moduleId) =>
        set((state) => {
          const progress = { ...state.userResourceProgress };
          progress[moduleId] = {
            userId: 'explorer-1',
            moduleId,
            completed: true,
            completedAt: new Date().toISOString()
          };
          return { userResourceProgress: progress };
        }),

      submitQuizScore: (moduleId, score, answers, xpEarned) =>
        set((state) => {
          const reviews = { ...state.quizReviews };
          const percentage = Math.round((score / answers.length) * 100);
          reviews[moduleId] = {
            moduleId,
            score,
            totalQuestions: answers.length,
            xpEarned,
            percentage,
            answers,
            completedAt: new Date().toISOString()
          };

          // Unlock next module and mark this as completed
          const nextStates = { ...state.moduleStates };
          nextStates[moduleId] = 'completed';

          const seq = state.modules.map((m) => m.id);
          const currentIdx = seq.indexOf(moduleId);
          
          if (currentIdx !== -1 && currentIdx + 1 < seq.length) {
            const nextModuleId = seq[currentIdx + 1];
            if (nextStates[nextModuleId] === 'locked') {
              nextStates[nextModuleId] = 'current';
            }
          }

          return {
            quizReviews: reviews,
            moduleStates: nextStates,
            xp: state.xp + xpEarned
          };
        }),

      resetProgress: () =>
        set({
          modules: getInitialModules(),
          moduleStates: getInitialModuleStates(getInitialModules()),
          xp: 1250,
          streak: 7,
          userResourceProgress: {},
          quizReviews: {}
        }),
    }),
    {
      name: 'aws-roadmap-platform-store', // persist state in localStorage
    }
  )
);
