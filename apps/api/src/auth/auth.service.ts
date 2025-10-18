import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

export type PublicUser = { id: string; email: string; displayName: string };

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  toPublic(u: { id: string; email: string; displayName: string }): PublicUser {
    return { id: u.id, email: u.email, displayName: u.displayName };
  }

  async register(email: string, password: string, displayName: string) {
    email = email.trim().toLowerCase();
    if (!displayName?.trim()) throw new BadRequestException('displayName required');
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, displayName: displayName.trim() },
    });

    return this.toPublic(user);
  }

  async validate(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  signAccessCookie(user: PublicUser) {
    const payload = { sub: user.id, email: user.email, displayName: user.displayName };
    const token = this.jwt.sign(payload);
    // httpOnly cookie name
    const cookieName = 'access_token';
    // cookie string (Nest manual set in controller)
    const isProd = process.env.NODE_ENV === 'production';
    const cookie = `${cookieName}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=7200${isProd ? '; Secure' : ''}`;
    return { cookieName, cookie, token };
  }
}
