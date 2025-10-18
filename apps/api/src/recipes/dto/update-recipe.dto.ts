import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;
}
