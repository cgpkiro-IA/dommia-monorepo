import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FinanceAdminGuard } from '../auth/guards/finance-admin.guard';
import { TenantsModule } from '../tenants/tenants.module';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationsService } from './services/notifications.service';
import { NotificationDeliveryService } from './services/notification-delivery.service';

@Module({
  imports: [DatabaseModule, TenantsModule],
  controllers: [NotificationsController],
  providers: [NotificationsRepository, NotificationsService, NotificationDeliveryService, FinanceAdminGuard],
  exports: [NotificationDeliveryService],
})
export class NotificationsModule {}