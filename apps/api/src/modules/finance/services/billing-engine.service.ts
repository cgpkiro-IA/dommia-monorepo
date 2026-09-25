import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BillingEngineRepository } from '../repositories/billing-engine.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { NoticesRepository } from '../../notices/repositories/notices.repository';
import {
  GenerateMonthlyChargesDto,
  CreatePaymentDto,
  QueryChargesDto,
  QueryPaymentsDto,
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

    if (dto.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a $0.00 MXN.');
    }

    const result = await this.billingRepo.recordPayment(tenant.slug, dto);
    if (!result) {
      throw new NotFoundException('La propiedad especificada no existe en este fraccionamiento.');
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

  async getPayments(slug: string, filters: QueryPaymentsDto) {
    const tenant = await this.validateTenant(slug);
    const payments = await this.billingRepo.findAllPayments(tenant.slug, filters);
    return {
      success: true,
      data: payments,
      count: payments.length,
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
}
