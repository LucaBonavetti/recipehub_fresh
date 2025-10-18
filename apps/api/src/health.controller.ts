import { Controller, Get } from '@nestjs/common';

@Controller('api/health')
export class HealthController {
  @Get()
  healthy() {
    return { ok: true, ts: new Date().toISOString() };
  }
}
