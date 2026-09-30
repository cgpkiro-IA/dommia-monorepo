import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ResidentAuthGuard, ResidentSessionClaims } from '../../auth/guards/resident-auth.guard';
import { CreateVisitorInvitationDto } from '../dto/access.dto';
import { AccessService } from '../services/access.service';
import { Roles } from '../../auth/decorators/auth-metadata.decorator';

@Controller('auth/resident/invitations')
@UseGuards(ResidentAuthGuard)
@Roles('RESIDENT')
export class ResidentInvitationsController {
  constructor(private readonly accessService: AccessService) {}

  @Get()
  async list(@Req() request: { user: ResidentSessionClaims }) {
    return { success: true, data: await this.accessService.listInvitations(request.user) };
  }

  @Post()
  async create(@Req() request: { user: ResidentSessionClaims }, @Body() dto: CreateVisitorInvitationDto) {
    return { success: true, data: await this.accessService.createInvitation(request.user, dto) };
  }

  @Delete(':id')
  async revoke(@Req() request: { user: ResidentSessionClaims }, @Param('id') id: string) {
    return { success: true, data: await this.accessService.revokeInvitation(request.user, id) };
  }
}