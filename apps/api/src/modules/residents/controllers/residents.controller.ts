import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ResidentsService } from '../services/residents.service';
import { CreateResidentDto, UpdateResidentDto } from '../dto/resident.dto';

@Controller('tenants/:slug/residents')
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  async getResidents(
    @Param('slug') slug: string,
    @Query('propertyId') propertyId?: string,
  ) {
    const residents = await this.residentsService.getTenantResidents(slug, propertyId);
    return {
      success: true,
      data: residents,
      count: residents.length,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createResident(
    @Param('slug') slug: string,
    @Body() dto: CreateResidentDto,
  ) {
    const resident = await this.residentsService.createTenantResident(slug, dto);
    return {
      success: true,
      message: `Residente "${resident.first_name} ${resident.last_name}" registrado exitosamente.`,
      data: resident,
    };
  }

  @Put(':id')
  async updateResident(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateResidentDto,
  ) {
    const resident = await this.residentsService.updateTenantResident(slug, id, dto);
    return {
      success: true,
      message: 'Residente actualizado exitosamente.',
      data: resident,
    };
  }

  @Delete(':id')
  async deleteResident(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const result = await this.residentsService.deleteTenantResident(slug, id);
    return {
      success: true,
      message: result.message,
    };
  }
}
