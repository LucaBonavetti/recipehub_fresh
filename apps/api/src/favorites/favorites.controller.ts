import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('api')
export class FavoritesController {
  constructor(private favs: FavoritesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  async myFavorites(@Req() req: any) {
    return this.favs.listForUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('recipes/:id/favorite')
  async favorite(@Param('id') id: string, @Req() req: any) {
    return this.favs.add(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('recipes/:id/favorite')
  async unfavorite(@Param('id') id: string, @Req() req: any) {
    return this.favs.remove(req.user.id, id);
  }
}
