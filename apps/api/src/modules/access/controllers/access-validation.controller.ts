import { Body, Controller, Get, Header, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessOperatorClaims, AccessOperatorGuard } from '../guards/access-operator.guard';
import {
  CreateGuardServiceDto,
  ManualAccessOverrideDto,
  ManualVisitAccessDto,
  RegisterServiceExitDto,
  UnifiedAuditLogQueryDto,
  ValidateAccessDto,
} from '../dto/access.dto';
import { AccessService } from '../services/access.service';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';
import { Public } from '../../auth/decorators/auth-metadata.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('tenants/:slug/access')
@Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'GUARD')
export class AccessValidationController {
  constructor(private readonly accessService: AccessService) {}

  @Get('invitations/:id/pass')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Header('Cache-Control', 'no-store, max-age=0')
  async getGuestPass(@Param('slug') slug: string, @Param('id') id: string) {
    return { success: true, data: await this.accessService.getGuestPass(slug, id) };
  }

  @Post('validate')
  @UseGuards(AccessOperatorGuard)
  async validate(
    @Param('slug') slug: string,
    @Req() request: { user: AccessOperatorClaims },
    @Body() dto: ValidateAccessDto,
  ) {
    return { success: true, data: await this.accessService.validateAccess(slug, request.user.sub, dto.payload) };
  }

  @Get('lookup')
  @UseGuards(AccessOperatorGuard)
  async lookup(
    @Param('slug') slug: string,
    @Req() request: { user: AccessOperatorClaims },
    @Query('query') query?: string,
  ) {
    return { success: true, data: await this.accessService.lookupGuardContext(slug, request.user.sub, query || '') };
  }

  @Get('manual-visits')
  @UseGuards(AccessOperatorGuard)
  async manualVisitCandidates(
    @Param('slug') slug: string,
    @Req() request: { user: AccessOperatorClaims },
    @Query('query') query?: string,
  ) {
    return { success: true, data: await this.accessService.findManualVisitCandidates(slug, request.user.sub, query || '') };
  }

  @Get('manual-visits/properties')
  @UseGuards(AccessOperatorGuard)
  async manualVisitPropertySuggestions(
    @Param('slug') slug: string,
    @Query('query') query?: string,
  ) {
    return { success: true, data: await this.accessService.findManualVisitPropertySuggestions(slug, query || '') };
  }

  @Post('manual-visits/:id/authorize')
  @UseGuards(AccessOperatorGuard)
  async authorizeManualVisit(
    @Param('slug') slug: string,
    @Param('id') invitationId: string,
    @Req() request: { user: AccessOperatorClaims },
    @Body() dto: ManualVisitAccessDto,
  ) {
    return { success: true, data: await this.accessService.authorizeManualVisit(slug, request.user.sub, invitationId, dto) };
  }

  @Post('manual-override')
  @UseGuards(AccessOperatorGuard)
  async manualOverride(
    @Param('slug') slug: string,
    @Req() request: { user: AccessOperatorClaims },
    @Body() dto: ManualAccessOverrideDto,
  ) {
    return { success: true, data: await this.accessService.manualOverride(slug, request.user.sub, dto) };
  }

  @Post('services')
  @UseGuards(AccessOperatorGuard)
  async createService(
    @Param('slug') slug: string,
    @Req() request: { user: AccessOperatorClaims },
    @Body() dto: CreateGuardServiceDto,
  ) {
    return { success: true, data: await this.accessService.createGuardService(slug, request.user.sub, dto) };
  }

  @Get('access-points')
  @UseGuards(AccessOperatorGuard)
  async listActiveAccessPoints(@Param('slug') slug: string) {
    return { success: true, data: await this.accessService.listAccessPoints(slug, true) };
  }

  @Get('services')
  @UseGuards(AccessOperatorGuard)
  async listServices(
    @Param('slug') slug: string,
    @Query('status') status?: 'IN_TRANSIT' | 'COMPLETED' | 'ALL',
  ) {
    return { success: true, data: await this.accessService.listGuardServices(slug, status) };
  }

  @Post('services/:id/exit')
  @UseGuards(AccessOperatorGuard)
  async registerServiceExit(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Req() request: { user: AccessOperatorClaims },
    @Body() dto?: RegisterServiceExitDto,
  ) {
    return { success: true, data: await this.accessService.registerServiceExit(slug, id, request.user.sub, dto) };
  }

  @Get('unified-log')
  @UseGuards(AccessOperatorGuard)
  async getUnifiedAuditLog(
    @Param('slug') slug: string,
    @Query() query: UnifiedAuditLogQueryDto,
  ) {
    return { success: true, data: await this.accessService.getUnifiedAuditLog(slug, query) };
  }
}