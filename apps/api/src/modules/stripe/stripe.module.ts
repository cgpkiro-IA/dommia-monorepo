import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { TenantsModule } from '../tenants/tenants.module';
import { StripeController } from './controllers/stripe.controller';
import { StripeRepository } from './repositories/stripe.repository';
import { StripeService } from './services/stripe.service';

@Module({
  imports: [DatabaseModule, AuthModule, FinanceModule, TenantsModule],
  controllers: [StripeController],
  providers: [StripeRepository, StripeService],
})
export class StripeModule {}
