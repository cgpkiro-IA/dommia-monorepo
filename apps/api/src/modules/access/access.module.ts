import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { TenantsModule } from '../tenants/tenants.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AccessValidationController } from './controllers/access-validation.controller';
import { ResidentInvitationsController } from './controllers/resident-invitations.controller';
import { ResidentAccessController } from './controllers/resident-access.controller';
import { ResidentAppAccessController } from './controllers/resident-app-access.controller';
import { AccessOperatorGuard } from './guards/access-operator.guard';
import { FinanceAdminGuard } from '../auth/guards/finance-admin.guard';
import { AccessService } from './services/access.service';
import { AccessRepository } from './repositories/access.repository';
import { GuardUsersController } from './controllers/guard-users.controller';

@Module({
  imports: [DatabaseModule, AuthModule, TenantsModule, NotificationsModule],
  controllers: [ResidentInvitationsController, ResidentAccessController, ResidentAppAccessController, AccessValidationController, GuardUsersController],
  providers: [AccessService, AccessRepository, AccessOperatorGuard, FinanceAdminGuard],
  exports: [AccessService, AccessOperatorGuard],
})
export class AccessModule {}