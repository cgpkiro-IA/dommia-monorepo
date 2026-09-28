import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { FinanceAdminGuard } from '../../auth/guards/finance-admin.guard';
import { CreateGuardUserDto } from '../dto/access.dto';
import { AccessService } from '../services/access.service';

@Controller('tenants/:slug/guards')
@UseGuards(FinanceAdminGuard)
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