import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './jwt.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const u = await this.auth.register(dto.email, dto.password, dto.displayName);
    return { ok: true, user: u };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const u = await this.auth.validate(dto.email, dto.password);
    const pub = this.auth.toPublic(u);
    const { cookie } = this.auth.signAccessCookie(pub);
    res.setHeader('Set-Cookie', cookie);
    return res.json({ ok: true, user: pub });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
      'Set-Cookie',
      `access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProd ? '; Secure' : ''}`,
    );
    return res.json({ ok: true });
  }

  // Require a valid JWT; when logged-in, req.user is set by JwtStrategy
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return { user: req.user };
  }
}
