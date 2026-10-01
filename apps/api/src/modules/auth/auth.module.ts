import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { ApiAuthGuard } from './guards/api-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [DatabaseModule, NotificationsModule, PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({}), ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])],
  controllers: [AuthController, ResidentAppAuthController, ResidentAppDevicesController],
  providers: [AuthService, AuthRepository, InMemoryResidentRateLimiter, ResidentAuthGuard, ResidentAppAuthGuard, AdminSessionGuard, CrmAdminGuard, ApiAuthGuard, RolesGuard, JwtStrategy],
  exports: [AuthService, AuthRepository, ResidentAuthGuard, ResidentAppAuthGuard, AdminSessionGuard, CrmAdminGuard, ApiAuthGuard, RolesGuard],
})
export class AuthModule {}
