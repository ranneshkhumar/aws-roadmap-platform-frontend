import { ModuleLevel } from '../../../generated/prisma/client.js';

export class ContinueModuleDto {
  slug: string;
  name: string;
  description: string;
  level: ModuleLevel;
  tier: string;
  topicSlug: string;
  topicName: string;
  estimatedMinutes: number;
  slideCount: number;
  questionCount: number;
}

export class ContinueResponseDto {
  module: ContinueModuleDto | null;
}
