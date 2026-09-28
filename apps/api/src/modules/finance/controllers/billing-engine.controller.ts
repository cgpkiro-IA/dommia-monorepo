import {
  Controller,
  Get,
  Post,
  Patch,
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
  SubmitSpeiPaymentDto,
  ReviewPaymentDto,
  CreateAnnualCampaignDto,
  AnnualCampaignQuoteDto,
  SubmitAnnualPaymentDto,
} from '../dto/financial-operations.dto';
import { UseGuards } from '@nestjs/common';
import { FinanceAdminGuard } from '../../auth/guards/finance-admin.guard';

@Controller('tenants/:slug/finance')
export class BillingEngineController {
  constructor(private readonly billingService: BillingEngineService) {}

  @Post('billing/generate')
  @UseGuards(FinanceAdminGuard)
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
  @UseGuards(FinanceAdminGuard)
  async recordPayment(
    @Param('slug') slug: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.billingService.recordPayment(slug, dto);
  }

  @Post('payments/cash')
  @UseGuards(FinanceAdminGuard)
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

  @Post('payments/spei-submissions')
  async submitSpeiPayment(
    @Param('slug') slug: string,
    @Body() dto: SubmitSpeiPaymentDto,
  ) {
    return this.billingService.submitSpeiPayment(slug, dto);
  }

  @Patch('payments/:id/review')
  @UseGuards(FinanceAdminGuard)
  async reviewPayment(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: ReviewPaymentDto,
  ) {
    return this.billingService.reviewPayment(slug, id, dto);
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

  @Get('annual-campaigns')
  async listAnnualCampaigns(@Param('slug') slug: string) {
    return this.billingService.listAnnualCampaigns(slug);
  }

  @Post('annual-campaigns')
  @UseGuards(FinanceAdminGuard)
  async createAnnualCampaign(@Param('slug') slug: string, @Body() dto: CreateAnnualCampaignDto) {
    return this.billingService.createAnnualCampaign(slug, dto);
  }

  @Post('annual-campaigns/:campaignId/quote')
  async getAnnualCampaignQuote(
    @Param('slug') slug: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: AnnualCampaignQuoteDto,
  ) {
    return this.billingService.getAnnualCampaignQuote(slug, campaignId, dto);
  }

  @Post('annual-campaigns/:campaignId/submissions')
  async submitAnnualPayment(
    @Param('slug') slug: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: SubmitAnnualPaymentDto,
  ) {
    return this.billingService.submitAnnualPayment(slug, campaignId, dto, 'SPEI_TRANSFER');
  }

  @Post('annual-campaigns/:campaignId/cash')
  @UseGuards(FinanceAdminGuard)
  async recordAnnualCashPayment(
    @Param('slug') slug: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: SubmitAnnualPaymentDto,
  ) {
    return this.billingService.submitAnnualPayment(slug, campaignId, dto, 'CASH');
  }

  @Get('annual-campaigns/:campaignId/commitments')
  async listAnnualCommitments(@Param('slug') slug: string, @Param('campaignId') campaignId: string) {
    return this.billingService.listAnnualCommitments(slug, campaignId);
  }

  @Patch('annual-commitments/:id/review')
  @UseGuards(FinanceAdminGuard)
  async reviewAnnualCommitment(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: ReviewPaymentDto,
  ) {
    return this.billingService.reviewAnnualCommitment(slug, id, dto);
  }
}
