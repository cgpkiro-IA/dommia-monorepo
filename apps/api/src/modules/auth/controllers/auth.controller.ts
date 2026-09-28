import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { ResidentActivateDto, ResidentChangePasswordDto, ResidentLoginDto, ResidentPasswordRecoveryRequestDto, ResidentPasswordResetDto } from '../dto/resident-auth.dto';
import { ResidentAuthGuard, ResidentSessionClaims } from '../guards/resident-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const session = await this.authService.login(dto);
    return {
      success: true,
      message: 'Autenticación exitosa',
      data: session,
    };
  }

  @Post('resident/login')
  @HttpCode(HttpStatus.OK)
  async residentLogin(@Body() dto: ResidentLoginDto) {
    return { success: true, message: 'Autenticación Resident exitosa', data: await this.authService.residentLogin(dto) };
  }

  @Post('resident/activate')
  @HttpCode(HttpStatus.OK)
  async residentActivate(@Body() dto: ResidentActivateDto) {
    return this.authService.activateResident(dto);
  }

  @Get('resident/me')
  @UseGuards(ResidentAuthGuard)
  async residentProfile(@Req() request: { user: ResidentSessionClaims }) {
    return { success: true, data: await this.authService.residentProfile(request.user.tenantSlug, request.user.sub) };
  }

  @Post('resident/logout')
  @UseGuards(ResidentAuthGuard)
  @HttpCode(HttpStatus.OK)
  async residentLogout(@Req() request: { user: ResidentSessionClaims }) {
    return this.authService.residentLogout(request.user.jti);
  }

  @Post('resident/change-password')
  @HttpCode(HttpStatus.OK)
  async residentChangePassword(@Body() dto: ResidentChangePasswordDto) {
    return this.authService.changeResidentPassword(dto);
  }

  @Post('resident/password-recovery')
  @HttpCode(HttpStatus.OK)
  async residentPasswordRecovery(@Body() dto: ResidentPasswordRecoveryRequestDto) {
    return this.authService.requestResidentPasswordRecovery(dto);
  }

  @Post('resident/password-reset')
  @HttpCode(HttpStatus.OK)
  async residentPasswordReset(@Body() dto: ResidentPasswordResetDto) {
    return this.authService.resetResidentPassword(dto);
  }
}
