import { Body, Controller, Get, Header, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccessOperatorClaims, AccessOperatorGuard } from '../guards/access-operator.guard';
import { ManualAccessOverrideDto, ValidateAccessDto } from '../dto/access.dto';
import { AccessService } from '../services/access.service';

@Controller('tenants/:slug/access')
export class AccessValidationController {
  constructor(private readonly accessService: AccessService) {}

  @Get('invitations/:id/pass')
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

  @Post('manual-override')
  @UseGuards(AccessOperatorGuard)
  async manualOverride(
    @Param('slug') slug: string,
    @Req() request: { user: AccessOperatorClaims },
    @Body() dto: ManualAccessOverrideDto,
  ) {
    return { success: true, data: await this.accessService.manualOverride(slug, request.user.sub, dto) };
  }
}