import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { BillingEngineService } from './billing-engine.service';

@Injectable()
export class FinanceSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FinanceSchedulerService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly tenantsRepo: TenantsRepository,
    private readonly billingService: BillingEngineService,
  ) {}

  onModuleInit() {
    this.scheduleNextRun();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  async runMonthlyBilling(year: number, month: number) {
    const tenants = (await this.tenantsRepo.findAll()).filter((tenant) => tenant.is_active);

    for (const tenant of tenants) {
      try {
        const result = await this.billingService.generateMonthlyCharges(tenant.slug, {
          year,
          month,
          dryRun: false,
        });
        this.logger.log(`Monthly billing completed for ${tenant.slug}: ${result.data.chargesCount} charges.`);
      } catch (error) {
        this.logger.error(`Monthly billing failed for ${tenant.slug}.`, error instanceof Error ? error.stack : undefined);
      }
    }
  }

  private scheduleNextRun() {
    const now = new Date();
    const nextRun = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const delay = Math.max(nextRun.getTime() - now.getTime(), 1000);

    this.timer = setTimeout(async () => {
      await this.runMonthlyBilling(nextRun.getFullYear(), nextRun.getMonth() + 1);
      this.scheduleNextRun();
    }, delay);

    this.logger.log(`Next monthly billing scheduled for ${nextRun.toISOString()}.`);
  }
}