import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CrmController } from './controllers/crm.controller';
import { CrmService } from './services/crm.service';
import { CrmRepository } from './repositories/crm.repository';
import { TelegramAlertService } from './services/telegram-alert.service';
import { CrmAlertsService } from './services/crm-alerts.service';
import { CrmAnalyticsService } from './services/crm-analytics.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, TenantsModule, AuthModule],
  controllers: [CrmController],
  providers: [
    CrmService,
    CrmRepository,
    TelegramAlertService,
    CrmAlertsService,
    CrmAnalyticsService,
  ],
  exports: [
    CrmService,
    CrmRepository,
    TelegramAlertService,
    CrmAlertsService,
    CrmAnalyticsService,
  ],
})
export class CrmModule {}

