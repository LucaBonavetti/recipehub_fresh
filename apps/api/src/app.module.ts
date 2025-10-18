import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [RecipesModule],
  controllers: [HealthController],
})
export class AppModule {}
