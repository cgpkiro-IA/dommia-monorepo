import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FeeConfigurationRepository } from '../repositories/fee-configuration.repository';
import { TenantsService } from '../../tenants/services/tenants.service';
import { CreateFeeConfigurationDto, UpdateFeeConfigurationDto } from '../dto/fee-configuration.dto';

@Injectable()
export class FeeConfigurationService {
  constructor(
    private readonly feeRepo: FeeConfigurationRepository,
    private readonly tenantsService: TenantsService,
  ) {}

  private async validateTenant(slug: string) {
    const tenant = await this.tenantsService.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException(`Fraccionamiento con slug "${slug}" no encontrado.`);
    }
    return tenant;
  }

  async getFees(slug: string, activeOnly: boolean = false) {
    await this.validateTenant(slug);
    return this.feeRepo.findAllByTenant(slug, activeOnly);
  }

  async getFeeById(slug: string, id: string) {
    await this.validateTenant(slug);
    const fee = await this.feeRepo.findById(slug, id);
    if (!fee) {
      throw new NotFoundException(`Configuración de cuota con ID "${id}" no encontrada.`);
    }
    return fee;
  }

  async createFee(slug: string, dto: CreateFeeConfigurationDto) {
    await this.validateTenant(slug);

    if (dto.baseAmount < 0) {
      throw new BadRequestException('El monto base no puede ser negativo.');
    }

    return this.feeRepo.create(slug, dto);
  }

  async updateFee(slug: string, id: string, dto: UpdateFeeConfigurationDto) {
    await this.validateTenant(slug);
    await this.getFeeById(slug, id);

    return this.feeRepo.update(slug, id, dto);
  }

  async deleteFee(slug: string, id: string) {
    await this.validateTenant(slug);
    await this.getFeeById(slug, id);

    return this.feeRepo.delete(slug, id);
  }

  async simulateFee(slug: string, id: string) {
    await this.validateTenant(slug);
    const fee = await this.getFeeById(slug, id);
    const properties = await this.feeRepo.getPropertiesForSimulation(slug);

    let totalBaseRevenue = 0;
    let totalEarlyBirdRevenue = 0;
    let totalLateRevenue = 0;

    const propertyBreakdowns = properties.map((prop: any) => {
      let baseFee = Number(fee.base_amount || fee.baseAmount);

      if (fee.fee_type === 'VARIABLE_LOT_SIZE' || fee.feeType === 'VARIABLE_LOT_SIZE') {
        const lotM2 = Number(prop.lot_size_m2) || 150.0;
        baseFee = Number((baseFee * lotM2).toFixed(2));
      }

      // Descuento pronto pago
      let discountAmount = 0;
      const discountType = fee.early_bird_discount_type || fee.earlyBirdDiscountType;
      const discountVal = Number(fee.early_bird_discount_amount || fee.earlyBirdDiscountAmount || 0);

      if (discountType === 'PERCENTAGE') {
        discountAmount = Number(((baseFee * discountVal) / 100).toFixed(2));
      } else if (discountType === 'FIXED') {
        discountAmount = Math.min(baseFee, discountVal);
      }
      const earlyBirdTotal = Number((baseFee - discountAmount).toFixed(2));

      // Recargo por mora
      let surchargeAmount = 0;
      const lateType = fee.late_fee_type || fee.lateFeeType;
      const lateVal = Number(fee.late_fee_amount || fee.lateFeeAmount || 0);

      if (lateType === 'PERCENTAGE') {
        surchargeAmount = Number(((baseFee * lateVal) / 100).toFixed(2));
      } else if (lateType === 'FIXED') {
        surchargeAmount = lateVal;
      }
      const lateTotal = Number((baseFee + surchargeAmount).toFixed(2));

      totalBaseRevenue += baseFee;
      totalEarlyBirdRevenue += earlyBirdTotal;
      totalLateRevenue += lateTotal;

      return {
        propertyId: prop.id,
        address: `${prop.street} #${prop.exterior_number}${prop.interior_number ? ' Int ' + prop.interior_number : ''}`,
        lotSizeM2: Number(prop.lot_size_m2),
        isDelinquent: prop.is_delinquent,
        baseFee,
        discountAmount,
        earlyBirdTotal,
        surchargeAmount,
        lateTotal,
      };
    });

    return {
      feeSummary: {
        id: fee.id,
        name: fee.name,
        feeType: fee.fee_type || fee.feeType,
        baseAmount: Number(fee.base_amount || fee.baseAmount),
        frequency: fee.frequency,
        dueDay: fee.due_day || fee.dueDay,
        graceDays: fee.grace_days || fee.graceDays,
        lateFeePolicy: `${fee.late_fee_type || fee.lateFeeType} (${fee.late_fee_amount || fee.lateFeeAmount})`,
        earlyBirdPolicy: `${fee.early_bird_discount_type || fee.earlyBirdDiscountType} (${fee.early_bird_discount_amount || fee.earlyBirdDiscountAmount})`,
      },
      projection: {
        totalPropertiesCount: properties.length,
        projectedBaseRevenue: Number(totalBaseRevenue.toFixed(2)),
        projectedEarlyBirdRevenue: Number(totalEarlyBirdRevenue.toFixed(2)),
        projectedLateRevenue: Number(totalLateRevenue.toFixed(2)),
        averageFeePerProperty: properties.length > 0 ? Number((totalBaseRevenue / properties.length).toFixed(2)) : 0,
      },
      propertiesSample: propertyBreakdowns.slice(0, 10),
    };
  }
}
