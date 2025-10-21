import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async add(userId: string, recipeId: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (!recipe.isPublic && recipe.ownerId !== userId) {
      throw new ForbiddenException('Cannot favorite a private recipe you do not own');
    }
    await this.prisma.favorite.upsert({
      where: { userId_recipeId: { userId, recipeId } },
      update: {},
      create: { userId, recipeId },
    });
    return { ok: true };
  }

  async remove(userId: string, recipeId: string) {
    await this.prisma.favorite.delete({
      where: { userId_recipeId: { userId, recipeId } },
    }).catch(() => {});
    return { ok: true };
  }

  async listForUser(userId: string) {
    const favs = await this.prisma.favorite.findMany({
      where: {
        userId,
        recipe: {
          OR: [{ isPublic: true }, { ownerId: userId }],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            description: true,
            imagePath: true,
            isPublic: true,
            ownerId: true,
            ownerName: true,
          },
        },
      },
    });
    return { items: favs.map((f) => f.recipe) };
  }

  async setFlags(userId: string, recipes: { id: string }[]) {
    if (!userId || recipes.length === 0) return new Set<string>();
    const ids = recipes.map((r) => r.id);
    const favs = await this.prisma.favorite.findMany({
      where: { userId, recipeId: { in: ids } },
      select: { recipeId: true },
    });
    return new Set(favs.map((f) => f.recipeId));
  }

  async isFavorited(userId: string, recipeId: string) {
    if (!userId) return false;
    const f = await this.prisma.favorite.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
      select: { userId: true },
    });
    return Boolean(f);
  }
}
