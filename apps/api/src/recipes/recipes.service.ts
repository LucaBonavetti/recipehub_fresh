import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Viewer = { id?: string } | null;

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  private sanitize(recipe: any, viewerId?: string, isFavorited: boolean = false) {
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description ?? null,
      ingredients: recipe.ingredients ?? [],
      steps: recipe.steps ?? [],
      tags: recipe.tags ?? [],
      imagePath: recipe.imagePath ?? null,
      sourceUrl: recipe.sourceUrl ?? null,
      servings: recipe.servings ?? null,
      prepMinutes: recipe.prepMinutes ?? null,
      cookMinutes: recipe.cookMinutes ?? null,
      isPublic: recipe.isPublic ?? true,
      ownerId: recipe.ownerId,
      ownerName: recipe.ownerName ?? null,
      version: recipe.version,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      isFavorited: Boolean(isFavorited),
      canEdit: viewerId ? viewerId === recipe.ownerId : false,
    };
  }

  async list(viewer: Viewer, q?: string) {
    const viewerId = viewer?.id;

    const whereSearch =
      q && q.trim()
        ? {
            OR: [
              { title: { contains: q } },        // keep simple (case-sensitive) to satisfy your Prisma client types
              { description: { contains: q } },
            ],
          }
        : undefined;

    const all = await this.prisma.recipe.findMany({
      orderBy: { updatedAt: 'desc' },
      where: whereSearch,
    });

    // Only show public recipes or your own
    const visible = all.filter((r) => r.isPublic || r.ownerId === viewerId);

    // Compute favorite flags for viewer
    let favSet = new Set<string>();
    if (viewerId && visible.length) {
      const favs = await this.prisma.favorite.findMany({
        where: { userId: viewerId, recipeId: { in: visible.map((r) => r.id) } },
        select: { recipeId: true },
      });
      favSet = new Set(favs.map((f) => f.recipeId));
    }

    return {
      items: visible.map((r) => this.sanitize(r, viewerId, favSet.has(r.id))),
    };
  }

  async byId(id: string, viewer: Viewer) {
    const viewerId = viewer?.id;
    const r = await this.prisma.recipe.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Recipe not found');
    if (!r.isPublic && r.ownerId !== viewerId) {
      throw new ForbiddenException('You cannot view this recipe');
    }

    let isFav = false;
    if (viewerId) {
      const fav = await this.prisma.favorite.findUnique({
        where: { userId_recipeId: { userId: viewerId, recipeId: id } },
        select: { recipeId: true },
      });
      isFav = Boolean(fav);
    }

    return this.sanitize(r, viewerId, isFav);
  }

  async create(ownerId: string, ownerName: string, dto: any) {
    const created = await this.prisma.recipe.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        ingredients: dto.ingredients ?? [],
        steps: dto.steps ?? [],
        tags: dto.tags ?? [],
        imagePath: dto.imagePath ?? null,
        sourceUrl: dto.sourceUrl ?? null,
        servings: dto.servings ?? null,
        prepMinutes: dto.prepMinutes ?? null,
        cookMinutes: dto.cookMinutes ?? null,
        isPublic: dto.isPublic ?? true,
        ownerId,
        ownerName,
      },
    });
    return this.sanitize(created, ownerId, false);
  }

  async update(id: string, userId: string, dto: any) {
    const existing = await this.prisma.recipe.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (existing.ownerId !== userId) throw new ForbiddenException('Not your recipe');

    const updated = await this.prisma.recipe.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        ingredients: dto.ingredients ?? undefined,
        steps: dto.steps ?? undefined,
        tags: dto.tags ?? undefined,
        imagePath: dto.imagePath ?? undefined,
        sourceUrl: dto.sourceUrl ?? undefined,
        servings: dto.servings ?? undefined,
        prepMinutes: dto.prepMinutes ?? undefined,
        cookMinutes: dto.cookMinutes ?? undefined,
        isPublic: dto.isPublic ?? undefined,
        version: { increment: 1 },
      },
    });

    // keep current favorite status for the updater
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_recipeId: { userId, recipeId: id } },
      select: { recipeId: true },
    });

    return this.sanitize(updated, userId, Boolean(fav));
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.recipe.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Recipe not found');
    if (existing.ownerId !== userId) throw new ForbiddenException('Not your recipe');
    await this.prisma.recipe.delete({ where: { id } });
    return { ok: true };
  }
}
