import { IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

export class CreateRecipeDto {
  @IsString()
  @MinLength(1)
  title!: string;

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

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'sourceUrl must be a valid http(s) URL' })
  sourceUrl?: string | null;

  // NEW
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
