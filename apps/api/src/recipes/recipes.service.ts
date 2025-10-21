import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Viewer = { id?: string } | null;

type ListOpts = {
  q?: string;
  visibility?: 'public' | 'mine' | 'all';
  sort?: 'new' | 'old' | 'title';
  page?: number;
  pageSize?: number;
};

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

  async list(viewer: Viewer, opts: ListOpts = {}) {
    const viewerId = viewer?.id;
    let vis: 'public' | 'mine' | 'all' = (opts.visibility as any) || 'all';
    if (!viewerId && vis !== 'public') vis = 'public';

    const searchWhere = opts.q?.trim()
      ? { OR: [{ title: { contains: opts.q } }, { description: { contains: opts.q } }] }
      : undefined;

    let visibilityWhere: any;
    if (vis === 'public') visibilityWhere = { isPublic: true };
    else if (vis === 'mine') visibilityWhere = { ownerId: viewerId };
    else visibilityWhere = viewerId
      ? { OR: [{ isPublic: true }, { ownerId: viewerId }] }
      : { isPublic: true };

    const where = searchWhere ? { AND: [searchWhere, visibilityWhere] } : visibilityWhere;

    let orderBy: any = { updatedAt: 'desc' };
    if (opts.sort === 'old') orderBy = { updatedAt: 'asc' };
    if (opts.sort === 'title') orderBy = { title: 'asc' };

    const page = Math.max(1, Number.isFinite(opts.page!) ? Number(opts.page) : 1);
    const pageSize = Math.min(50, Math.max(1, Number.isFinite(opts.pageSize!) ? Number(opts.pageSize) : 12));
    const skip = (page - 1) * pageSize;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.recipe.count({ where }),
      this.prisma.recipe.findMany({ where, orderBy, skip, take: pageSize }),
    ]);

    // Favorite flags for viewer
    let favSet = new Set<string>();
    if (viewerId && rows.length) {
      const favs = await this.prisma.favorite.findMany({
        where: { userId: viewerId, recipeId: { in: rows.map((r) => r.id) } },
        select: { recipeId: true },
      });
      favSet = new Set(favs.map((f) => f.recipeId));
    }

    return {
      items: rows.map((r) => this.sanitize(r, viewerId, favSet.has(r.id))),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
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
