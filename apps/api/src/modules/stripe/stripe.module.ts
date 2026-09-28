import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { TenantsModule } from '../tenants/tenants.module';
import { StripeController } from './controllers/stripe.controller';
import { StripeService } from './services/stripe.service';

@Module({
  imports: [DatabaseModule, AuthModule, FinanceModule, TenantsModule],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
