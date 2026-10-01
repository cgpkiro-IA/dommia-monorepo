import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { ResidentsModule } from './modules/residents/residents.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { AuthModule } from './modules/auth/auth.module';
import { CrmModule } from './modules/crm/crm.module';
import { HealthModule } from './modules/health/health.module';
import { NoticesModule } from './modules/notices/notices.module';
import { FinanceModule } from './modules/finance/finance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { AccessModule } from './modules/access/access.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { GuardOperationsModule } from './modules/guard-operations/guard-operations.module';
import { ApiAuthGuard } from './modules/auth/guards/api-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    DatabaseModule,
    TenantsModule,
    PropertiesModule,
    ResidentsModule,
    VehiclesModule,
    AuthModule,
    CrmModule,
    HealthModule,
    NoticesModule,
    FinanceModule,
    NotificationsModule,
    StripeModule,
    AccessModule,
    DeliveriesModule,
    GuardOperationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useExisting: ApiAuthGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
  ],
})
export class AppModule {}
