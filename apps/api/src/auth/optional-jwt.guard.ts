import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard:
 * - If a valid JWT cookie is present, sets req.user.
 * - If missing/invalid, does NOT throw (continues as anonymous).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // ignore errors and just return user or null
  handleRequest(_err: any, user: any) {
    return user ?? null;
  }
}
