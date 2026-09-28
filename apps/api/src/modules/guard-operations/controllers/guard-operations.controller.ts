import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessOperatorClaims, AccessOperatorGuard } from '../../access/guards/access-operator.guard';
import { FinanceAdminGuard } from '../../auth/guards/finance-admin.guard';
import { CreateGuardIncidentDto, CreateVehicleFlagDto, GuardHistoryQueryDto } from '../dto/guard-operations.dto';
import { GuardOperationsService } from '../services/guard-operations.service';

@Controller('tenants/:slug/guard')
@UseGuards(AccessOperatorGuard)
export class GuardOperationsController {
  constructor(private readonly guardOperations: GuardOperationsService) {}

  @Post('incidents')
  async createIncident(
    @Param('slug') slug: string,
    @Req() request: { user: AccessOperatorClaims },
    @Body() dto: CreateGuardIncidentDto,
  ) {
    return { success: true, data: await this.guardOperations.createIncident(slug, request.user.sub, dto) };
  }

  @Get('incidents')
  @UseGuards(FinanceAdminGuard)
  async listIncidents(@Param('slug') slug: string, @Query('status') status?: string) {
    return { success: true, data: await this.guardOperations.listIncidents(slug, status) };
  }

  @Patch('incidents/:id/resolve')
  @UseGuards(FinanceAdminGuard)
  async resolveIncident(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Req() request: { user: AccessOperatorClaims },
  ) {
    return { success: true, data: await this.guardOperations.resolveIncident(slug, id, request.user.sub) };
  }

  @Get('history')
  async history(@Param('slug') slug: string, @Query() query: GuardHistoryQueryDto) {
    return { success: true, data: await this.guardOperations.history(slug, query) };
  }

  @Get('vehicle-flags')
  @UseGuards(FinanceAdminGuard)
  async listVehicleFlags(@Param('slug') slug: string) {
    return { success: true, data: await this.guardOperations.listVehicleFlags(slug) };
  }

  @Post('vehicle-flags')
  @UseGuards(FinanceAdminGuard)
  async createVehicleFlag(
    @Param('slug') slug: string,
    @Req() request: { user: AccessOperatorClaims },
    @Body() dto: CreateVehicleFlagDto,
  ) {
    return { success: true, data: await this.guardOperations.createVehicleFlag(slug, request.user.sub, dto) };
  }

  @Delete('vehicle-flags/:id')
  @UseGuards(FinanceAdminGuard)
  async removeVehicleFlag(@Param('slug') slug: string, @Param('id') id: string, @Req() request: { user: AccessOperatorClaims }) {
    return { success: true, data: await this.guardOperations.removeVehicleFlag(slug, id, request.user.sub) };
  }
}