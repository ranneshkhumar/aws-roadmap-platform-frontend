import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class ReorderModulesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[];
}
