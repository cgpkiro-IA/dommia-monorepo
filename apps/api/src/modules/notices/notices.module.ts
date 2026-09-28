import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsModule } from '../tenants/tenants.module';
import { NoticesController } from './controllers/notices.controller';
import { NoticesService } from './services/notices.service';
import { NoticesRepository } from './repositories/notices.repository';

@Module({
  imports: [DatabaseModule, TenantsModule],
  controllers: [NoticesController],
  providers: [NoticesService, NoticesRepository],
  exports: [NoticesService, NoticesRepository],
})
export class NoticesModule {}
