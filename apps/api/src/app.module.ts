import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
  ],
})
export class AppModule {}
