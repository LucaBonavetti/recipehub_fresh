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
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('api/recipes')
export class RecipesController {
  constructor(private readonly recipes: RecipesService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async list(@Req() req: any, @Query('q') q?: string) {
    const viewer = req.user ?? null;
    return this.recipes.list(viewer, q);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async byId(@Param('id') id: string, @Req() req: any) {
    const viewer = req.user ?? null;
    return this.recipes.byId(id, viewer);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateRecipeDto, @Req() req: any) {
    const u = req.user;
    return this.recipes.create(u.id, u.displayName, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRecipeDto, @Req() req: any) {
    const u = req.user;
    return this.recipes.update(id, u.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const u = req.user;
    return this.recipes.remove(id, u.id);
  }
}
