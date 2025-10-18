import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const rec = await this.prisma.recipe.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Recipe not found');
    return rec;
  }

  create(dto: CreateRecipeDto) {
    return this.prisma.recipe.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        ingredients: dto.ingredients ?? [],
        steps: dto.steps ?? [],
        tags: (dto.tags ?? []).map((t) => t.trim()).filter(Boolean),
        servings: dto.servings ?? null,
        prepMinutes: dto.prepMinutes ?? null,
        cookMinutes: dto.cookMinutes ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateRecipeDto) {
    await this.get(id); // throws if missing
    return this.prisma.recipe.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        ingredients: dto.ingredients ?? undefined,
        steps: dto.steps ?? undefined,
        tags: dto.tags ? dto.tags.map((t) => t.trim()).filter(Boolean) : undefined,
        servings: dto.servings ?? undefined,
        prepMinutes: dto.prepMinutes ?? undefined,
        cookMinutes: dto.cookMinutes ?? undefined,
      },
    });
  }

  async remove(id: string) {
    await this.get(id); // throws if missing
    await this.prisma.recipe.delete({ where: { id } });
    return { ok: true };
  }
}
