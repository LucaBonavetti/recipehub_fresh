import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('api/users')
export class UsersController {
  constructor(private users: UsersService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async profile(@Param('id') id: string, @Req() req: any) {
    const viewerId = req.user?.id;
    return this.users.getProfile(id, viewerId);
  }
}
