import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RecipesModule } from './recipes/recipes.module';
import { UploadsModule } from './uploads/uploads.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    AuthModule,     // <-- mounts /api/auth/*
    RecipesModule,  // <-- mounts /api/recipes/*
    UploadsModule,  // <-- mounts /api/uploads/*
  ],
  providers: [PrismaService],
})
export class AppModule {}
