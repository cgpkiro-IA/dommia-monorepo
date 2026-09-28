import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ResidentsController } from './controllers/residents.controller';
import { ResidentsService } from './services/residents.service';
import { ResidentsRepository } from './repositories/residents.repository';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FinanceAdminGuard } from '../auth/guards/finance-admin.guard';

@Module({
  imports: [DatabaseModule, TenantsModule, AuthModule, NotificationsModule],
  controllers: [ResidentsController],
  providers: [ResidentsService, ResidentsRepository, FinanceAdminGuard],
  exports: [ResidentsService, ResidentsRepository],
})
export class ResidentsModule {}
