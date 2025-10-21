import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(targetId: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, displayName: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // If it's me -> all my recipes; else -> only my public recipes
    const where =
      viewerId === targetId
        ? { ownerId: targetId }
        : { ownerId: targetId, isPublic: true };

    const recipes = await this.prisma.recipe.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        imagePath: true,
        isPublic: true,
        ownerId: true,
        ownerName: true,
        updatedAt: true,
      },
    });

    return {
      user: {
        id: user.id,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
      recipes,
    };
  }
}
