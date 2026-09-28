import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
})
export class HealthModule {}
