import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { VehiclesService } from '../services/vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';

@Controller('tenants/:slug/vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  async getVehicles(
    @Param('slug') slug: string,
    @Query('propertyId') propertyId?: string,
  ) {
    const vehicles = await this.vehiclesService.getTenantVehicles(slug, propertyId);
    return {
      success: true,
      data: vehicles,
      count: vehicles.length,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createVehicle(
    @Param('slug') slug: string,
    @Body() dto: CreateVehicleDto,
  ) {
    const vehicle = await this.vehiclesService.createTenantVehicle(slug, dto);
    return {
      success: true,
      message: `Vehículo con placas "${vehicle.plates}" registrado exitosamente.`,
      data: vehicle,
    };
  }

  @Put(':id')
  async updateVehicle(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    const vehicle = await this.vehiclesService.updateTenantVehicle(slug, id, dto);
    return {
      success: true,
      message: 'Vehículo actualizado exitosamente.',
      data: vehicle,
    };
  }

  @Delete(':id')
  async deleteVehicle(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const result = await this.vehiclesService.deleteTenantVehicle(slug, id);
    return {
      success: true,
      message: result.message,
    };
  }
}
