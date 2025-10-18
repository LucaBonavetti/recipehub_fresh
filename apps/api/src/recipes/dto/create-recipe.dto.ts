import { IsString, MinLength } from 'class-validator';

export class CreateRecipeDto {
  @IsString()
  @MinLength(1)
  title!: string;
}
