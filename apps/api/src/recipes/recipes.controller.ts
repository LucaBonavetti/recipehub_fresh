import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Controller('api/recipes')
export class RecipesController {
  constructor(private svc: RecipesService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('tags') tagsStr?: string,         // comma-separated: "vegan,gluten-free"
    @Query('order') order?: 'recent' | 'title',
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const tags = tagsStr
      ? tagsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const limit = limitStr ? Number(limitStr) : undefined;
    const offset = offsetStr ? Number(offsetStr) : undefined;

    return this.svc.list({ q, tags, order, limit, offset });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post()
  create(@Body() dto: CreateRecipeDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
