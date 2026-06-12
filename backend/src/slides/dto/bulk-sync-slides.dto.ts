import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SlideSyncDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['TEXT_ONLY', 'TEXT_IMAGE', 'IMAGE_ONLY'], {
    message: 'layoutType must be one of: TEXT_ONLY, TEXT_IMAGE, IMAGE_ONLY',
  })
  layoutType: string;

  @IsInt()
  @Min(0)
  orderIndex: number;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bullets?: string[];
}

export class BulkSyncSlidesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlideSyncDto)
  slides: SlideSyncDto[];
}
