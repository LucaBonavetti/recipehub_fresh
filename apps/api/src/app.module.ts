import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RecipesModule } from './recipes/recipes.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [RecipesModule, UploadsModule],
  controllers: [HealthController],
})
export class AppModule {}
