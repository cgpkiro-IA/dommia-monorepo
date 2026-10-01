import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FinanceAdminGuard } from '../../auth/guards/finance-admin.guard';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';
import { CreateGuardAccessPointDto, UpdateGuardAccessPointDto } from '../dto/access.dto';
import { AccessService } from '../services/access.service';

@Controller('tenants/:slug/access-points')
@UseGuards(FinanceAdminGuard)
@Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
export class AccessPointsController {
  constructor(private readonly accessService: AccessService) {}

  @Get()
  async list(@Param('slug') slug: string) {
    return { success: true, data: await this.accessService.listAccessPoints(slug) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('slug') slug: string, @Body() dto: CreateGuardAccessPointDto) {
    return { success: true, data: await this.accessService.createAccessPoint(slug, dto) };
  }

  @Patch(':id')
  async update(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateGuardAccessPointDto,
  ) {
    return { success: true, data: await this.accessService.updateAccessPoint(slug, id, dto) };
  }
}