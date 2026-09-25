import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { PropertiesService } from '../services/properties.service';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto';

@Controller('tenants/:slug/properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async getProperties(@Param('slug') slug: string) {
    const result = await this.propertiesService.getTenantProperties(slug);
    return {
      success: true,
      data: result.properties,
      metrics: result.metrics,
      tenant: result.tenant,
      count: result.properties.length,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addProperty(
    @Param('slug') slug: string,
    @Body() dto: CreatePropertyDto,
  ) {
    const property = await this.propertiesService.createTenantProperty(slug, dto);
    return {
      success: true,
      message: 'Propiedad registrada exitosamente.',
      data: property,
    };
  }

  @Put(':id')
  async updateProperty(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    const property = await this.propertiesService.updateTenantProperty(slug, id, dto);
    return {
      success: true,
      message: 'Propiedad actualizada exitosamente.',
      data: property,
    };
  }

  @Delete(':id')
  async deleteProperty(
    @Param('slug') slug: string,
    @Param('id') id: string,
  ) {
    const result = await this.propertiesService.deleteTenantProperty(slug, id);
    return {
      success: true,
      message: result.message,
    };
  }
}
