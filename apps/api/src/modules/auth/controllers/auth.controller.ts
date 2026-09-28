import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { DisableMfaDto, MfaCodeDto, SelectTenantDto, StartMfaSetupDto, VerifyMfaLoginDto } from '../dto/admin-mfa.dto';
import { ResidentActivateDto, ResidentChangePasswordDto, ResidentLoginDto, ResidentPasswordRecoveryRequestDto, ResidentPasswordResetDto } from '../dto/resident-auth.dto';
import { ResidentAuthGuard, ResidentSessionClaims } from '../guards/resident-auth.guard';
import { AdminSessionGuard, AdminSessionClaims } from '../guards/admin-session.guard';

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

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfaLogin(@Body() dto: VerifyMfaLoginDto) {
    return {
      success: true,
      message: 'Autenticación de dos pasos exitosa',
      data: await this.authService.verifyMfaLogin(dto.challengeToken, dto.code),
    };
  }

  @Get('mfa/status')
  @UseGuards(AdminSessionGuard)
  async mfaStatus(@Req() request: { user: AdminSessionClaims }) {
    return { success: true, data: await this.authService.getMfaStatus(request.user.sub) };
  }

  @Post('mfa/setup')
  @UseGuards(AdminSessionGuard)
  @HttpCode(HttpStatus.OK)
  async startMfaSetup(@Req() request: { user: AdminSessionClaims }, @Body() dto: StartMfaSetupDto) {
    return { success: true, data: await this.authService.startMfaSetup(request.user.sub, dto.password) };
  }

  @Post('mfa/enable')
  @UseGuards(AdminSessionGuard)
  @HttpCode(HttpStatus.OK)
  async enableMfa(@Req() request: { user: AdminSessionClaims }, @Body() dto: MfaCodeDto) {
    return { success: true, data: await this.authService.enableMfa(request.user.sub, dto.code) };
  }

  @Post('mfa/disable')
  @UseGuards(AdminSessionGuard)
  @HttpCode(HttpStatus.OK)
  async disableMfa(@Req() request: { user: AdminSessionClaims }, @Body() dto: DisableMfaDto) {
    return { success: true, data: await this.authService.disableMfa(request.user.sub, dto.password, dto.code) };
  }

  @Post('select-tenant')
  @UseGuards(AdminSessionGuard)
  @HttpCode(HttpStatus.OK)
  async selectTenant(@Req() request: { user: AdminSessionClaims }, @Body() dto: SelectTenantDto) {
    return { success: true, data: await this.authService.selectTenant(request.user.sub, dto.tenantSlug) };
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
