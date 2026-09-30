import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TenantsModule } from '../tenants/tenants.module';
import { DeliveriesController } from './controllers/deliveries.controller';
import { DeliveriesRepository } from './repositories/deliveries.repository';
import { DeliveriesService } from './services/deliveries.service';

@Module({
  imports: [AccessModule, DatabaseModule, NotificationsModule, TenantsModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesRepository, DeliveriesService],
  exports: [DeliveriesRepository, DeliveriesService],
})
export class DeliveriesModule {}