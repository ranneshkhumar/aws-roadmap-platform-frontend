import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
