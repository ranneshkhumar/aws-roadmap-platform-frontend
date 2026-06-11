import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tier?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpPoints?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
