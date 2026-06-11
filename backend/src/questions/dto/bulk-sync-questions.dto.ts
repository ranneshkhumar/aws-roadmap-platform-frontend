import { IsString, IsNotEmpty, IsInt, Min, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionSyncDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  optionA: string;

  @IsString()
  @IsNotEmpty()
  optionB: string;

  @IsString()
  @IsNotEmpty()
  optionC: string;

  @IsString()
  @IsNotEmpty()
  optionD: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['A', 'B', 'C', 'D'], {
    message: 'correctAnswer must be one of: A, B, C, D',
  })
  correctAnswer: string;

  @IsString()
  @IsNotEmpty()
  explanation: string;

  @IsInt()
  @Min(0)
  orderIndex: number;
}

export class BulkSyncQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionSyncDto)
  questions: QuestionSyncDto[];
}
