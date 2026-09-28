import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AccessModule } from '../access/access.module';
import { AccessOperatorGuard } from '../access/guards/access-operator.guard';
import { FinanceAdminGuard } from '../auth/guards/finance-admin.guard';
import { GuardOperationsController } from './controllers/guard-operations.controller';
import { GuardOperationsRepository } from './repositories/guard-operations.repository';
import { GuardOperationsService } from './services/guard-operations.service';

@Module({
  imports: [DatabaseModule, AccessModule],
  controllers: [GuardOperationsController],
  providers: [GuardOperationsRepository, GuardOperationsService, AccessOperatorGuard, FinanceAdminGuard],
})
export class GuardOperationsModule {}