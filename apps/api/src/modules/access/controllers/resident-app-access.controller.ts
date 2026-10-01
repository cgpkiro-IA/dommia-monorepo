import { Body, Controller, Delete, Get, Header, Param, Post, Req, UseFilters, UseGuards } from '@nestjs/common';
import { ResidentAppAuthGuard, ResidentSessionClaims } from '../../auth/guards/resident-auth.guard';
import { ResidentAppExceptionFilter } from '../../auth/filters/resident-app-exception.filter';
import { CreateVisitorInvitationDto } from '../dto/access.dto';
import { AccessService } from '../services/access.service';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';

@Controller('auth/app/resident')
@UseFilters(ResidentAppExceptionFilter)
@UseGuards(ResidentAppAuthGuard)
@Roles('RESIDENT')
export class ResidentAppAccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get('access-credential')
  @Header('Cache-Control', 'no-store, max-age=0')
  async getCredential(@Req() request: { user: ResidentSessionClaims }) {
    return { success: true, data: await this.accessService.getResidentCredential(request.user) };
  }

  @Get('access-credential/active-services')
  @Header('Cache-Control', 'no-store, max-age=0')
  async getActiveServices(@Req() request: { user: ResidentSessionClaims }) {
    return { success: true, data: await this.accessService.listActiveServicesForResident(request.user) };
  }

  @Get('access-credential/active-deliveries')
  @Header('Cache-Control', 'no-store, max-age=0')
  async getActiveDeliveries(@Req() request: { user: ResidentSessionClaims }) {
    return { success: true, data: await this.accessService.listActiveDeliveriesForResident(request.user) };
  }

  @Get('invitations')
  async listInvitations(@Req() request: { user: ResidentSessionClaims }) {
    return { success: true, data: await this.accessService.listInvitations(request.user) };
  }

  @Post('invitations')
  async createInvitation(
    @Req() request: { user: ResidentSessionClaims },
    @Body() dto: CreateVisitorInvitationDto,
  ) {
    return { success: true, data: await this.accessService.createInvitation(request.user, dto) };
  }

  @Delete('invitations/:id')
  async revokeInvitation(@Req() request: { user: ResidentSessionClaims }, @Param('id') id: string) {
    return { success: true, data: await this.accessService.revokeInvitation(request.user, id) };
  }
}
