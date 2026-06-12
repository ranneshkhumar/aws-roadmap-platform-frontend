import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerSubmitDto {
  @IsInt()
  @Min(0)
  questionOrder: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['A', 'B', 'C', 'D'], {
    message: 'selectedAnswer must be one of: A, B, C, D',
  })
  selectedAnswer: string;
}

export class QuizAttemptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerSubmitDto)
  answers: AnswerSubmitDto[];
}
