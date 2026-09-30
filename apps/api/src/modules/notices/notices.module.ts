import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsModule } from '../tenants/tenants.module';
import { NoticesController } from './controllers/notices.controller';
import { ResidentAppNoticesController } from './controllers/resident-app-notices.controller';
import { AuthModule } from '../auth/auth.module';
import { NoticesService } from './services/notices.service';
import { NoticesRepository } from './repositories/notices.repository';

@Module({
  imports: [DatabaseModule, TenantsModule, AuthModule],
  controllers: [NoticesController, ResidentAppNoticesController],
  providers: [NoticesService, NoticesRepository],
  exports: [NoticesService, NoticesRepository],
})
export class NoticesModule {}
