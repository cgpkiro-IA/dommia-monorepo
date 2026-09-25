import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FeeConfigurationService } from '../services/fee-configuration.service';
import { CreateFeeConfigurationDto, UpdateFeeConfigurationDto } from '../dto/fee-configuration.dto';

@Controller('tenants/:slug/finance/fees')
export class FeeConfigurationController {
  constructor(private readonly feeService: FeeConfigurationService) {}

  @Get()
  async getFees(
    @Param('slug') slug: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const isActiveOnly = activeOnly === 'true';
    const fees = await this.feeService.getFees(slug, isActiveOnly);
    return {
      success: true,
      data: fees,
      count: fees.length,
    };
  }

  @Get(':id')
  async getFeeById(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const fee = await this.feeService.getFeeById(slug, id);
    return {
      success: true,
      data: fee,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFee(
    @Param('slug') slug: string,
    @Body() dto: CreateFeeConfigurationDto,
  ) {
    const fee = await this.feeService.createFee(slug, dto);
    return {
      success: true,
      message: `Estructura de cuota "${fee.name}" configurada exitosamente.`,
      data: fee,
    };
  }

  @Put(':id')
  async updateFee(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateFeeConfigurationDto,
  ) {
    const fee = await this.feeService.updateFee(slug, id, dto);
    return {
      success: true,
      message: 'Configuración de cuota actualizada exitosamente.',
      data: fee,
    };
  }

  @Delete(':id')
  async deleteFee(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.feeService.deleteFee(slug, id);
    return {
      success: true,
      message: deleted ? 'Estructura de cuota eliminada exitosamente.' : 'No se pudo eliminar la cuota.',
    };
  }

  @Post(':id/simulate')
  async simulateFee(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const simulation = await this.feeService.simulateFee(slug, id);
    return {
      success: true,
      message: 'Simulación de cobro proyectado calculada exitosamente.',
      data: simulation,
    };
  }
}
