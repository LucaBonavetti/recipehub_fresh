import { Controller, Get, Post } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('api/db')
export class DbController {
  constructor(private prisma: PrismaService) {}

  @Get('recipes')
  async list() {
    const count = await this.prisma.recipe.count();
    const sample = await this.prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return { count, sample };
  }

  @Post('recipes/seed')
  async seed() {
    const count = await this.prisma.recipe.count();
    if (count === 0) {
      await this.prisma.recipe.create({
        data: { title: 'Hello, Recipe!' },
      });
    }
    const newCount = await this.prisma.recipe.count();
    return { ok: true, countBefore: count, countAfter: newCount };
  }
}
