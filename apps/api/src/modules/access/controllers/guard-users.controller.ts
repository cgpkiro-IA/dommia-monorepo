import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { FinanceAdminGuard } from '../../auth/guards/finance-admin.guard';
import { CreateGuardUserDto } from '../dto/access.dto';
import { AccessService } from '../services/access.service';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';

@Controller('tenants/:slug/guards')
@UseGuards(FinanceAdminGuard)
@Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
export class GuardUsersController {
  constructor(private readonly accessService: AccessService) {}

  @Get()
  async list(@Param('slug') slug: string) {
    return { success: true, data: await this.accessService.listGuards(slug) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('slug') slug: string, @Body() dto: CreateGuardUserDto) {
    return { success: true, data: await this.accessService.createGuard(slug, dto) };
  }
}