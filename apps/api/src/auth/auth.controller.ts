import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { OptionalJwtAuthGuard } from './optional-jwt.guard';

// If you already have DTOs in ./dto.ts, import them.
// They should at least contain: email, password, and for register also displayName.
import { LoginDto, RegisterDto } from './dto';

const COOKIE_NAME = 'access_token';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setAuthCookie(res: Response, token: string) {
    // For local dev: secure=false; in production behind HTTPS set secure=true
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.register(dto.email, dto.password, dto.displayName);
    this.setAuthCookie(res, token);
    return { user };
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(dto.email, dto.password);
    this.setAuthCookie(res, token);
    return { user };
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return { ok: true };
  }

  // Returns the current user if logged in (cookie present), else null
  @UseGuards(OptionalJwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    if (!req.user?.id) return { user: null };
    return this.auth.me(req.user.id);
  }
}
