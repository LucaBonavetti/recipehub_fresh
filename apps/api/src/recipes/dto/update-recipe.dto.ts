import { IsArray, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ingredients?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  prepMinutes?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  cookMinutes?: number | null;

  @IsOptional()
  @IsString()
  imagePath?: string | null;
}
