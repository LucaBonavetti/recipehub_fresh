import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma/prisma.service';
import { DbController } from './db.controller';

@Module({
  imports: [],
  controllers: [HealthController, DbController],
  providers: [PrismaService],
})
export class AppModule {}
