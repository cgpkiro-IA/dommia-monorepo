import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthController } from './controllers/auth.controller';
import { ResidentAppAuthController } from './controllers/resident-app-auth.controller';
import { ResidentAppDevicesController } from './controllers/resident-app-devices.controller';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { ResidentAppAuthGuard, ResidentAuthGuard } from './guards/resident-auth.guard';
import { AdminSessionGuard } from './guards/admin-session.guard';
import { CrmAdminGuard } from './guards/crm-admin.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { InMemoryResidentRateLimiter } from './services/resident-rate-limiter';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [AuthController, ResidentAppAuthController, ResidentAppDevicesController],
  providers: [AuthService, AuthRepository, InMemoryResidentRateLimiter, ResidentAuthGuard, ResidentAppAuthGuard, AdminSessionGuard, CrmAdminGuard],
  exports: [AuthService, AuthRepository, ResidentAuthGuard, ResidentAppAuthGuard, AdminSessionGuard, CrmAdminGuard],
})
export class AuthModule {}
