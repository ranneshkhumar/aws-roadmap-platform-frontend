export class TopicSummaryDto {
  slug: string;
  name: string;
  description: string;
  orderIndex: number;
  totalModules: number;
  completedModules: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export class TopicListResponseDto {
  topics: TopicSummaryDto[];
}
