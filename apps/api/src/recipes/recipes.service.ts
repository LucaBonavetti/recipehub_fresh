import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

type ListParams = {
  q?: string;
  tags?: string[];
  order?: 'recent' | 'title';
  limit?: number;
  offset?: number;
};

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async list(params: ListParams = {}) {
    const { q, tags, order = 'recent', limit = 100, offset = 0 } = params;

    const rows = await this.prisma.recipe.findMany({
      orderBy: order === 'title' ? { title: 'asc' } : { createdAt: 'desc' },
    });

    let filtered = rows;

    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        const title = (r.title ?? '').toLowerCase();
        const desc = ((r as any).description ?? '').toLowerCase();
        return title.includes(needle) || desc.includes(needle);
      });
    }

    if (tags && tags.length) {
      filtered = filtered.filter((r) => {
        const arr: string[] = Array.isArray((r as any).tags) ? (r as any).tags : [];
        const lower = arr.map((x) => x.toLowerCase());
        return tags.every((t) => lower.includes(t.toLowerCase()));
      });
    }

    const start = Math.max(0, Number(offset) || 0);
    const end = start + (Math.max(1, Math.min(500, Number(limit) || 100)));
    const page = filtered.slice(start, end);

    return { total: filtered.length, items: page };
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
        imagePath: dto.imagePath ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateRecipeDto) {
    await this.get(id);
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
        imagePath: dto.imagePath ?? undefined,
      },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.recipe.delete({ where: { id } });
    return { ok: true };
  }
}
