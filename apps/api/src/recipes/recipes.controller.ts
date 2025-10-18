import { Controller, Get, Query, Param, Post, Body, Patch, Delete, Req } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

type ReqWithViewer = { headers: Record<string, string | string[] | undefined> };

function viewer(req: ReqWithViewer) {
  const id = (req.headers['x-viewer-id'] as string) || null;
  const name = (req.headers['x-viewer-name'] as string) || null;
  return { id, name };
}

@Controller('api/recipes')
export class RecipesController {
  constructor(private readonly recipes: RecipesService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('tags') tagsCsv?: string,
    @Query('order') order?: 'recent' | 'title',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: ReqWithViewer,
  ) {
    const { id: viewerId } = viewer(req!);
    const tags = (tagsCsv ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return this.recipes.list({
      q: q ?? undefined,
      tags: tags.length ? tags : undefined,
      order: order ?? 'recent',
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
      viewerId,
    });
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: ReqWithViewer) {
    const { id: viewerId } = viewer(req);
    return this.recipes.getForViewer(id, viewerId);
  }

  @Post()
  create(@Body() dto: CreateRecipeDto, @Req() req: ReqWithViewer) {
    const { id: viewerId, name } = viewer(req);
    return this.recipes.create(dto, viewerId, name);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecipeDto, @Req() req: ReqWithViewer) {
    const { id: viewerId } = viewer(req);
    return this.recipes.update(id, dto, viewerId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: ReqWithViewer) {
    const { id: viewerId } = viewer(req);
    return this.recipes.remove(id, viewerId);
  }
}
