import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { ResidentAuthGuard } from './guards/resident-auth.guard';
import { AdminSessionGuard } from './guards/admin-session.guard';
import { CrmAdminGuard } from './guards/crm-admin.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, ResidentAuthGuard, AdminSessionGuard, CrmAdminGuard],
  exports: [AuthService, AuthRepository, ResidentAuthGuard, AdminSessionGuard, CrmAdminGuard],
})
export class AuthModule {}
