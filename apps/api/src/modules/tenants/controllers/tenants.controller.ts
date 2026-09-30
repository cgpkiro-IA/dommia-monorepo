import { Controller, Get, Post, Put, Patch, Body, Param, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { CrmAdminGuard } from '../../auth/guards/crm-admin.guard';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @UseGuards(CrmAdminGuard)
  async findAll() {
    const tenants = await this.tenantsService.findAll();
    return {
      success: true,
      data: tenants,
      count: tenants.length,
    };
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const tenant = await this.tenantsService.findBySlug(slug);
    return {
      success: true,
      data: tenant,
    };
  }

  @Post()
  @UseGuards(CrmAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTenantDto) {
    const result = await this.tenantsService.create(dto);
    return {
      success: true,
      message: `Fraccionamiento "${dto.name}" aprovisionado exitosamente con schema "${result.schema}".`,
      data: result,
    };
  }

  @Put(':slug')
  @UseGuards(CrmAdminGuard)
  async update(@Param('slug') slug: string, @Body() dto: UpdateTenantDto) {
    const updated = await this.tenantsService.update(slug, dto);
    return {
      success: true,
      message: `Fraccionamiento "${updated?.name || slug}" actualizado exitosamente.`,
      data: updated,
    };
  }

  @Patch(':slug')
  @UseGuards(CrmAdminGuard)
  async patch(@Param('slug') slug: string, @Body() dto: UpdateTenantDto) {
    const updated = await this.tenantsService.update(slug, dto);
    return {
      success: true,
      message: `Fraccionamiento "${updated?.name || slug}" actualizado exitosamente.`,
      data: updated,
    };
  }
}

