import { Body, Controller, Get, Param, Post, Req, UseFilters, UseGuards } from '@nestjs/common';
import { ResidentAppExceptionFilter } from '../../auth/filters/resident-app-exception.filter';
import { ResidentAppAuthGuard, ResidentSessionClaims } from '../../auth/guards/resident-auth.guard';
import { AnnualCampaignQuoteDto, SubmitAnnualPaymentDto, SubmitSpeiPaymentDto } from '../dto/financial-operations.dto';
import { ResidentAppAnnualPaymentDto, ResidentAppReceiptUploadDto, ResidentAppSpeiSubmissionDto } from '../dto/resident-app-finance.dto';
import { BillingEngineService } from '../services/billing-engine.service';
import { ResidentAppReceiptStorageService } from '../services/resident-app-receipt-storage.service';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';

type ResidentAppFinanceResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

@Controller('auth/app/resident/finance')
@UseFilters(ResidentAppExceptionFilter)
@UseGuards(ResidentAppAuthGuard)
@Roles('RESIDENT')
export class ResidentAppFinanceController {
  constructor(
    private readonly billingService: BillingEngineService,
    private readonly receiptStorage: ResidentAppReceiptStorageService,
  ) {}

  private normalizeResponse<T>(response: ResidentAppFinanceResponse<T>) {
    return {
      success: response.success,
      message: response.message ?? null,
      data: response.data,
    };
  }

  @Post('receipts')
  async uploadReceipt(@Body() dto: ResidentAppReceiptUploadDto) {
    return {
      success: true,
      message: 'Comprobante almacenado en modo local DEV.',
      data: await this.receiptStorage.store(dto.contentBase64, dto.contentType),
    };
  }

  @Get('status')
  async getStatus(@Req() request: { user: ResidentSessionClaims }) {
    return this.normalizeResponse(
      await this.billingService.getPropertyStatus(request.user.tenantSlug, request.user.propertyId),
    );
  }

  @Get('campaigns')
  async listCampaigns(@Req() request: { user: ResidentSessionClaims }) {
    return this.normalizeResponse(await this.billingService.listAnnualCampaigns(request.user.tenantSlug));
  }

  @Post('campaigns/:campaignId/quote')
  async getCampaignQuote(
    @Req() request: { user: ResidentSessionClaims },
    @Param('campaignId') campaignId: string,
  ) {
    const dto: AnnualCampaignQuoteDto = { propertyId: request.user.propertyId };
    return this.normalizeResponse(
      await this.billingService.getAnnualCampaignQuote(request.user.tenantSlug, campaignId, dto),
    );
  }

  @Post('spei-submissions')
  async submitSpei(
    @Req() request: { user: ResidentSessionClaims },
    @Body() dto: ResidentAppSpeiSubmissionDto,
  ) {
    const submission: SubmitSpeiPaymentDto = {
      ...dto,
      propertyId: request.user.propertyId,
    };
    return this.normalizeResponse(
      await this.billingService.submitSpeiPayment(request.user.tenantSlug, submission),
    );
  }

  @Post('campaigns/:campaignId/submissions')
  async submitCampaignPayment(
    @Req() request: { user: ResidentSessionClaims },
    @Param('campaignId') campaignId: string,
    @Body() dto: ResidentAppAnnualPaymentDto,
  ) {
    const submission: SubmitAnnualPaymentDto = {
      ...dto,
      propertyId: request.user.propertyId,
    };
    return this.normalizeResponse(
      await this.billingService.submitAnnualPayment(
        request.user.tenantSlug,
        campaignId,
        submission,
        'SPEI_TRANSFER',
      ),
    );
  }
}
