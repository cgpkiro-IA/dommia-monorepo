import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BillingEngineRepository } from '../repositories/billing-engine.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { NoticesRepository } from '../../notices/repositories/notices.repository';
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

@Injectable()
export class BillingEngineService {
  constructor(
    private readonly billingRepo: BillingEngineRepository,
    private readonly tenantsRepo: TenantsRepository,
    private readonly noticesRepo: NoticesRepository,
  ) {}

  private async validateTenant(slug: string) {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado.`);
    }
    return tenant;
  }

  async generateMonthlyCharges(slug: string, dto: GenerateMonthlyChargesDto) {
    const tenant = await this.validateTenant(slug);

    const now = new Date();
    const year = dto.year || now.getFullYear();
    const month = dto.month || now.getMonth() + 1;
    const dryRun = dto.dryRun ?? false;

    const result = await this.billingRepo.generateMonthlyCharges(
      tenant.slug,
      year,
      month,
      dryRun,
    );

    return {
      success: true,
      message: dryRun
        ? `Simulación de corte: Se proyectan ${result.chargesCount} cargos por un total de $${result.totalProjectedAmount.toLocaleString('es-MX')}.`
        : `Emisión de cobranza completada: Se generaron ${result.chargesCount} nuevos cargos para el período ${result.monthName} ${year}.`,
      data: result,
    };
  }

  async getCharges(slug: string, filters: QueryChargesDto) {
    const tenant = await this.validateTenant(slug);
    const charges = await this.billingRepo.findAllCharges(tenant.slug, filters);
    return {
      success: true,
      data: charges,
      count: charges.length,
    };
  }

  async recordPayment(slug: string, dto: CreatePaymentDto) {
    const tenant = await this.validateTenant(slug);

    if (['STRIPE_CARD'].includes(dto.paymentMethod || dto.payment_method || 'CASH') && !this.hasStripeEnabled(tenant.modules)) {
      throw new BadRequestException('Stripe no está habilitado para este fraccionamiento. Continúa con SPEI o efectivo.');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a $0.00 MXN.');
    }

    const result = await this.billingRepo.recordPayment(tenant.slug, dto);
    if (!result) {
      throw new NotFoundException('La propiedad especificada no existe en este fraccionamiento.');
    }
    if (result.invalidCharge) {
      throw new BadRequestException('El cargo seleccionado no existe o no pertenece a la vivienda indicada.');
    }
    if (result.exceedsBalance) {
      throw new BadRequestException(
        `El pago excede el saldo pendiente del cargo. Saldo disponible: $${Number(result.remainingBalance).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN.`,
      );
    }

    const methodLabels: Record<string, string> = {
      CASH: 'Efectivo en Ventanilla',
      SPEI_TRANSFER: 'Transferencia SPEI',
      BANK_DEPOSIT: 'Depósito Bancario',
      STRIPE_CARD: 'Tarjeta de Crédito / Débito',
    };
    const methodText = methodLabels[dto.paymentMethod || 'CASH'] || dto.paymentMethod;

    // Dispatch official circular notice for resident PWA confirmation
    try {
      await this.noticesRepo.create(tenant.slug, {
        title: `🧾 Recibo Acreditado: ${result.payment.reference} (${result.propertyAddress})`,
        content: `Se ha registrado y acreditado con éxito el pago por $${Number(dto.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN mediante ${methodText}. Folio interno: ${result.payment.reference}. Estado de vivienda: ${result.isDelinquent ? 'Adeudo pendiente' : 'Al Corriente'}.`,
        category: 'GENERAL',
        priority: 'MEDIUM',
        authorName: dto.receivedByName || 'Administración',
        isPinned: false,
        isPublished: true,
      });
    } catch (err) {
      console.warn('Notice creation on payment skipped:', err);
    }

    return {
      success: true,
      message: `¡Pago de $${Number(dto.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} registrado y acreditado correctamente! Folio: ${result.payment.reference}`,
      data: result,
    };
  }

  private hasStripeEnabled(modules: string[] | Record<string, boolean> | null | undefined) {
    if (Array.isArray(modules)) {
      return modules.some((module) => ['STRIPE', 'STRIPE_CONNECT', 'FINANCE_STRIPE'].includes(module));
    }
    return Boolean(modules && Object.entries(modules).some(([key, enabled]) => enabled && ['STRIPE', 'STRIPE_CONNECT', 'FINANCE_STRIPE'].includes(key)));
  }

  async getPayments(slug: string, filters: QueryPaymentsDto) {
    const tenant = await this.validateTenant(slug);
    const payments = await this.billingRepo.findAllPayments(tenant.slug, filters);
    return {
      success: true,
      data: payments,
      count: payments.length,
    };
  }

  async submitSpeiPayment(slug: string, dto: SubmitSpeiPaymentDto) {
    const tenant = await this.validateTenant(slug);
    const result = await this.billingRepo.submitSpeiPayment(tenant.slug, dto);
    if (!result) throw new NotFoundException('La vivienda indicada no existe en este fraccionamiento.');
    if (result.invalidCharge) throw new BadRequestException('El cargo indicado no pertenece a la vivienda.');
    if (result.duplicateReference) throw new BadRequestException('La referencia SPEI ya fue enviada anteriormente.');

    return {
      success: true,
      message: `Comprobante SPEI recibido para ${result.propertyAddress}. Queda pendiente de validación por administración.`,
      data: result,
    };
  }

  async reviewPayment(slug: string, id: string, dto: ReviewPaymentDto) {
    const tenant = await this.validateTenant(slug);
    const result = await this.billingRepo.reviewPayment(
      tenant.slug,
      id,
      dto.status,
      dto.reviewedByName,
      dto.notes,
    );
    if (!result) throw new NotFoundException('El comprobante no existe o ya fue revisado.');
    if (result.invalidCharge) throw new BadRequestException('El cargo asociado no pertenece a la vivienda.');
    if (result.exceedsBalance) {
      throw new BadRequestException(
        `El comprobante excede el saldo del cargo. Saldo disponible: $${Number(result.remainingBalance).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN.`,
      );
    }

    return {
      success: true,
      message: dto.status === 'APPROVED' ? 'Comprobante aprobado y pago acreditado.' : 'Comprobante rechazado.',
      data: result,
    };
  }

  async getPropertyStatus(slug: string, propertyId: string) {
    const tenant = await this.validateTenant(slug);
    const status = await this.billingRepo.getPropertyFinancialStatus(tenant.slug, propertyId);
    return {
      success: true,
      data: status,
    };
  }

  async getSummary(slug: string) {
    const tenant = await this.validateTenant(slug);
    const summary = await this.billingRepo.getFinancialSummary(tenant.slug);
    return {
      success: true,
      data: summary.summary,
    };
  }

  async listAnnualCampaigns(slug: string) {
    const tenant = await this.validateTenant(slug);
    return { success: true, data: await this.billingRepo.listAnnualCampaigns(tenant.slug) };
  }

  async createAnnualCampaign(slug: string, dto: CreateAnnualCampaignDto) {
    const tenant = await this.validateTenant(slug);
    return { success: true, data: await this.billingRepo.createAnnualCampaign(tenant.slug, dto) };
  }

  async getAnnualCampaignQuote(slug: string, campaignId: string, dto: AnnualCampaignQuoteDto) {
    const tenant = await this.validateTenant(slug);
    const quote = await this.billingRepo.getAnnualCampaignQuote(tenant.slug, campaignId, dto);
    if (!quote) throw new NotFoundException('La campaña anual no existe o no está activa.');
    if (quote.missingProperty) throw new NotFoundException('La vivienda indicada no existe.');
    return { success: true, data: quote };
  }

  async submitAnnualPayment(slug: string, campaignId: string, dto: SubmitAnnualPaymentDto, method: 'SPEI_TRANSFER' | 'CASH') {
    const tenant = await this.validateTenant(slug);
    const result: any = await this.billingRepo.submitAnnualPayment(tenant.slug, campaignId, dto, method);
    if (!result) throw new NotFoundException('La campaña anual no existe o no está activa.');
    if (result.missingProperty) throw new NotFoundException('La vivienda indicada no existe.');
    if (result.duplicateCommitment) throw new BadRequestException('La vivienda ya tiene un compromiso en esta campaña.');
    if (result.invalidAmount) throw new BadRequestException(`El monto debe ser exactamente $${Number(result.expectedAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN.`);
    return { success: true, message: 'Pago anual enviado a validación de administración.', data: result };
  }

  async listAnnualCommitments(slug: string, campaignId: string) {
    const tenant = await this.validateTenant(slug);
    return { success: true, data: await this.billingRepo.listAnnualCommitments(tenant.slug, campaignId) };
  }

  async reviewAnnualCommitment(slug: string, id: string, dto: ReviewPaymentDto) {
    const tenant = await this.validateTenant(slug);
    const commitment = await this.billingRepo.reviewAnnualCommitment(tenant.slug, id, dto.status, dto.reviewedByName, dto.notes);
    if (!commitment) throw new NotFoundException('El compromiso anual no existe o ya fue revisado.');
    return { success: true, message: dto.status === 'APPROVED' ? 'Pago anual aprobado y reservado para el periodo de campaña.' : 'Pago anual rechazado.', data: commitment };
  }
}
