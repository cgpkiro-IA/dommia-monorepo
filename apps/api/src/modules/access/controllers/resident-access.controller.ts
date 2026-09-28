import { Controller, Get, Header, Req, UseGuards } from '@nestjs/common';
import { ResidentAuthGuard, ResidentSessionClaims } from '../../auth/guards/resident-auth.guard';
import { AccessService } from '../services/access.service';

@Controller('auth/resident/access-credential')
@UseGuards(ResidentAuthGuard)
export class ResidentAccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get()
  @Header('Cache-Control', 'no-store, max-age=0')
  async getCredential(@Req() request: { user: ResidentSessionClaims }) {
    return { success: true, data: await this.accessService.getResidentCredential(request.user) };
  }
}