import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseFilters, UseGuards } from '@nestjs/common';
import {
  ResidentAppChangePasswordDto,
  ResidentAppLoginDto,
  ResidentAppPasswordRecoveryRequestDto,
  ResidentAppPasswordResetDto,
  ResidentAppRefreshDto,
} from '../dto/resident-app-auth.dto';
import { ResidentAppExceptionFilter } from '../filters/resident-app-exception.filter';
import { ResidentAppAuthGuard, ResidentSessionClaims } from '../guards/resident-auth.guard';
import { AuthService } from '../services/auth.service';

@Controller('auth/app/resident')
@UseFilters(ResidentAppExceptionFilter)
export class ResidentAppAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: ResidentAppLoginDto) {
    return { success: true, data: await this.authService.residentAppLogin(dto) };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Body() dto: ResidentAppChangePasswordDto) {
    const data = await this.authService.residentAppChangePassword(dto);
    return {
      success: true,
      message: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
      data,
    };
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.OK)
  async passwordRecovery(@Body() dto: ResidentAppPasswordRecoveryRequestDto) {
    return this.authService.requestResidentPasswordRecovery(dto);
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  async passwordReset(@Body() dto: ResidentAppPasswordResetDto) {
    return this.authService.residentAppResetPassword(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: ResidentAppRefreshDto) {
    return { success: true, data: await this.authService.residentAppRefresh(dto.refreshToken) };
  }

  @Get('me')
  @UseGuards(ResidentAppAuthGuard)
  async me(@Req() request: { user: ResidentSessionClaims }) {
    return { success: true, data: await this.authService.residentProfile(request.user.tenantSlug, request.user.sub) };
  }

  @Post('logout')
  @UseGuards(ResidentAppAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: { user: ResidentSessionClaims }) {
    return this.authService.residentAppLogout(request.user.jti);
  }

  @Get('sessions')
  @UseGuards(ResidentAppAuthGuard)
  async sessions(@Req() request: { user: ResidentSessionClaims }) {
    return {
      success: true,
      data: await this.authService.listResidentAppSessions(request.user.sub, request.user.tenantSlug, request.user.jti),
    };
  }

  @Delete('sessions/:id')
  @UseGuards(ResidentAppAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Param('id') id: string, @Req() request: { user: ResidentSessionClaims }) {
    return this.authService.revokeResidentAppSession(id, request.user.sub, request.user.tenantSlug);
  }
}