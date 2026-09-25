import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { BillingEngineService } from '../services/billing-engine.service';
import {
  GenerateMonthlyChargesDto,
  CreatePaymentDto,
  QueryChargesDto,
  QueryPaymentsDto,
} from '../dto/financial-operations.dto';

@Controller('tenants/:slug/finance')
export class BillingEngineController {
  constructor(private readonly billingService: BillingEngineService) {}

  @Post('billing/generate')
  async generateMonthlyBilling(
    @Param('slug') slug: string,
    @Body() dto: GenerateMonthlyChargesDto,
  ) {
    return this.billingService.generateMonthlyCharges(slug, dto);
  }

  @Get('charges')
  async getCharges(
    @Param('slug') slug: string,
    @Query() query: QueryChargesDto,
  ) {
    return this.billingService.getCharges(slug, query);
  }

  @Post('payments')
  async recordPayment(
    @Param('slug') slug: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.billingService.recordPayment(slug, dto);
  }

  @Post('payments/cash')
  async recordCashPayment(
    @Param('slug') slug: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.billingService.recordPayment(slug, dto);
  }

  @Get('payments')
  async getPayments(
    @Param('slug') slug: string,
    @Query() query: QueryPaymentsDto,
  ) {
    return this.billingService.getPayments(slug, query);
  }

  @Get('properties/:propertyId/status')
  async getPropertyStatus(
    @Param('slug') slug: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.billingService.getPropertyStatus(slug, propertyId);
  }

  @Get('summary')
  async getSummary(@Param('slug') slug: string) {
    return this.billingService.getSummary(slug);
  }
}
