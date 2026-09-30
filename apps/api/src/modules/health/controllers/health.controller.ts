import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { Public } from '../../auth/decorators/auth-metadata.decorator';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async check() {
    const isDbHealthy = await this.db.isHealthy();
    return {
      status: isDbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: 'running',
        database: isDbHealthy ? 'connected' : 'error',
        mqtt: 'configured',
      },
    };
  }
}
