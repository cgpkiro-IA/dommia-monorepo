import {
  ForbiddenException,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
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
import { ResidentAuthGuard, ResidentSessionClaims } from '../../auth/guards/resident-auth.guard';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';
import { FinanceCampaignGuard } from '../guards/finance-campaign.guard';

@Controller('tenants/:slug/finance')
export class BillingEngineController {
  constructor(private readonly billingService: BillingEngineService) {}

  private assertResidentProperty(user: ResidentSessionClaims, propertyId: string, tenantSlug: string) {
    if (user.role !== 'RESIDENT' || user.tenantSlug !== tenantSlug || user.propertyId !== propertyId) {
      throw new ForbiddenException('Solo puedes consultar o enviar pagos de tu vivienda.');
    }
  }

  @Post('billing/generate')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async generateMonthlyBilling(
    @Param('slug') slug: string,
    @Body() dto: GenerateMonthlyChargesDto,
  ) {
    return this.billingService.generateMonthlyCharges(slug, dto);
  }

  @Get('charges')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async getCharges(
    @Param('slug') slug: string,
    @Query() query: QueryChargesDto,
  ) {
    return this.billingService.getCharges(slug, query);
  }

  @Post('payments')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async recordPayment(
    @Param('slug') slug: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.billingService.recordPayment(slug, dto);
  }

  @Post('payments/cash')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async recordCashPayment(
    @Param('slug') slug: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.billingService.recordPayment(slug, dto);
  }

  @Get('payments')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async getPayments(
    @Param('slug') slug: string,
    @Query() query: QueryPaymentsDto,
  ) {
    return this.billingService.getPayments(slug, query);
  }

  @Post('payments/spei-submissions')
  @Roles('RESIDENT')
  @UseGuards(ResidentAuthGuard)
  async submitSpeiPayment(
    @Param('slug') slug: string,
    @Req() request: { user: ResidentSessionClaims },
    @Body() dto: SubmitSpeiPaymentDto,
  ) {
    this.assertResidentProperty(request.user, dto.propertyId, slug);
    return this.billingService.submitSpeiPayment(slug, dto);
  }

  @Patch('payments/:id/review')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async reviewPayment(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: ReviewPaymentDto,
  ) {
    return this.billingService.reviewPayment(slug, id, dto);
  }

  @Get('properties/:propertyId/status')
  @Roles('RESIDENT')
  @UseGuards(ResidentAuthGuard)
  async getPropertyStatus(
    @Param('slug') slug: string,
    @Param('propertyId') propertyId: string,
    @Req() request: { user: ResidentSessionClaims },
  ) {
    this.assertResidentProperty(request.user, propertyId, slug);
    return this.billingService.getPropertyStatus(slug, request.user.propertyId);
  }

  @Get('summary')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async getSummary(@Param('slug') slug: string) {
    return this.billingService.getSummary(slug);
  }

  @Get('annual-campaigns')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'RESIDENT')
  @UseGuards(FinanceCampaignGuard)
  async listAnnualCampaigns(@Param('slug') slug: string) {
    return this.billingService.listAnnualCampaigns(slug);
  }

  @Post('annual-campaigns')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async createAnnualCampaign(@Param('slug') slug: string, @Body() dto: CreateAnnualCampaignDto) {
    return this.billingService.createAnnualCampaign(slug, dto);
  }

  @Post('annual-campaigns/:campaignId/quote')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'RESIDENT')
  @UseGuards(FinanceCampaignGuard)
  async getAnnualCampaignQuote(
    @Param('slug') slug: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: AnnualCampaignQuoteDto,
    @Req() request: { user: ResidentSessionClaims },
  ) {
    if (request.user.role === 'RESIDENT') this.assertResidentProperty(request.user, dto.propertyId, slug);
    return this.billingService.getAnnualCampaignQuote(slug, campaignId, dto);
  }

  @Post('annual-campaigns/:campaignId/submissions')
  @Roles('RESIDENT')
  @UseGuards(ResidentAuthGuard)
  async submitAnnualPayment(
    @Param('slug') slug: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: SubmitAnnualPaymentDto,
    @Req() request: { user: ResidentSessionClaims },
  ) {
    this.assertResidentProperty(request.user, dto.propertyId, slug);
    return this.billingService.submitAnnualPayment(slug, campaignId, dto, 'SPEI_TRANSFER');
  }

  @Post('annual-campaigns/:campaignId/cash')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async recordAnnualCashPayment(
    @Param('slug') slug: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: SubmitAnnualPaymentDto,
  ) {
    return this.billingService.submitAnnualPayment(slug, campaignId, dto, 'CASH');
  }

  @Get('annual-campaigns/:campaignId/commitments')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async listAnnualCommitments(@Param('slug') slug: string, @Param('campaignId') campaignId: string) {
    return this.billingService.listAnnualCommitments(slug, campaignId);
  }

  @Patch('annual-commitments/:id/review')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async reviewAnnualCommitment(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: ReviewPaymentDto,
  ) {
    return this.billingService.reviewAnnualCommitment(slug, id, dto);
  }
}
