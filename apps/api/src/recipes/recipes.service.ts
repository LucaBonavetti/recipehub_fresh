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
      data: { title: dto.title },
    });
  }

  async update(id: string, dto: UpdateRecipeDto) {
    await this.get(id); // throws if missing
    return this.prisma.recipe.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: string) {
    await this.get(id); // throws if missing
    await this.prisma.recipe.delete({ where: { id } });
    return { ok: true };
  }
}
