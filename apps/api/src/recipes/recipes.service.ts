import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { join } from 'path';
import { unlink } from 'fs/promises';

type ListParams = {
  q?: string;
  tags?: string[];
  order?: 'recent' | 'title';
  limit?: number;
  offset?: number;
  viewerId?: string | null; // NEW
};

function isLocalUpload(p?: string | null): p is string {
  return !!p && /^\/uploads\//.test(p);
}
async function deleteLocalFile(p?: string | null) {
  if (!isLocalUpload(p)) return;
  const full = join(process.cwd(), p.replace(/^\//, ''));
  try { await unlink(full); } catch {}
}

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async list(params: ListParams = {}) {
    const { q, tags, order = 'recent', limit = 100, offset = 0, viewerId = null } = params;

    // Pull all, then filter (SQLite + JSON filters)
    const rows = await this.prisma.recipe.findMany({
      orderBy: order === 'title' ? { title: 'asc' } : { createdAt: 'desc' },
    });

    // Visibility: public OR owned by viewer
    let filtered = rows.filter((r) => r.isPublic || (viewerId && r.ownerId === viewerId));

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

  async getForViewer(id: string, viewerId: string | null) {
    const rec = await this.prisma.recipe.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Recipe not found');
    if (!rec.isPublic && rec.ownerId !== viewerId) {
      throw new ForbiddenException('You are not allowed to view this recipe');
    }
    return rec;
  }

  create(dto: CreateRecipeDto, ownerId: string | null, ownerName: string | null) {
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
        sourceUrl: dto.sourceUrl ?? null,
        isPublic: dto.isPublic ?? true,
        ownerId: ownerId ?? null,
        ownerName: ownerName ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateRecipeDto, viewerId: string | null) {
    const before = await this.prisma.recipe.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Recipe not found');
    if (!viewerId || before.ownerId !== viewerId) throw new ForbiddenException('Not your recipe');

    const updated = await this.prisma.recipe.update({
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
        sourceUrl: dto.sourceUrl ?? undefined,
        isPublic: dto.isPublic ?? undefined,
      },
    });

    if (dto.imagePath !== undefined && before.imagePath && before.imagePath !== dto.imagePath) {
      await deleteLocalFile(before.imagePath);
    }
    return updated;
  }

  async remove(id: string, viewerId: string | null) {
    const rec = await this.prisma.recipe.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Recipe not found');
    if (!viewerId || rec.ownerId !== viewerId) throw new ForbiddenException('Not your recipe');

    await this.prisma.recipe.delete({ where: { id } });
    await deleteLocalFile(rec.imagePath);
    return { ok: true };
  }
}
