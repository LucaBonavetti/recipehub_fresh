import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('api/recipes')
export class RecipesController {
  constructor(private readonly recipes: RecipesService) {}

  // Populate req.user if cookie exists; otherwise continue as anonymous
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  list(
    @Query('q') q?: string,
    @Query('tags') tagsCsv?: string,
    @Query('order') order?: 'recent' | 'title',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: any,
  ) {
    const viewerId: string | null = req?.user?.id ?? null;
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

  // Optional guard here too so owners can view their private recipes
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) {
    const viewerId: string | null = req?.user?.id ?? null;
    return this.recipes.getForViewer(id, viewerId);
  }

  // Write ops remain strictly authenticated
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRecipeDto, @Req() req: any) {
    const u = req.user as { id: string; displayName: string };
    return this.recipes.create(dto, u.id, u.displayName);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecipeDto, @Req() req: any) {
    const u = req.user as { id: string };
    return this.recipes.update(id, dto, u.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const u = req.user as { id: string };
    return this.recipes.remove(id, u.id);
  }
}
