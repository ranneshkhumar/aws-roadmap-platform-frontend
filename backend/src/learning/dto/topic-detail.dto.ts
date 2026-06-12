import { ModuleLevel, ProgressStatus } from '../../../generated/prisma/client.js';

export class ModuleSummaryDto {
  slug: string;
  name: string;
  description: string;
  level: ModuleLevel;
  tier: string;
  xpPoints: number;
  estimatedMinutes: number;
  orderIndex: number;
  status: ProgressStatus;
  score: number | null;
  slideCount: number;
  questionCount: number;
}

export class TopicProgressDto {
  totalModules: number;
  completedModules: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export class TopicDetailDto {
  slug: string;
  name: string;
  description: string;
  orderIndex: number;
  modules: ModuleSummaryDto[];
  progress: TopicProgressDto;
}
