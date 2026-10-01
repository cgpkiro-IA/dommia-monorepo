import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Req, UseFilters, UseGuards } from '@nestjs/common';
import { ResidentAppPushTokenDto } from '../dto/resident-app-auth.dto';
import { ResidentAppExceptionFilter } from '../filters/resident-app-exception.filter';
import { ResidentAppAuthGuard, ResidentSessionClaims } from '../guards/resident-auth.guard';
import { AuthRepository } from '../repositories/auth.repository';
import { Roles } from '../decorators/auth-metadata.decorator';

@Controller('auth/app/resident/devices')
@UseFilters(ResidentAppExceptionFilter)
@UseGuards(ResidentAppAuthGuard)
@Roles('RESIDENT')
export class ResidentAppDevicesController {
  constructor(private readonly authRepository: AuthRepository) {}

  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  async registerPushToken(
    @Req() request: { user: ResidentSessionClaims },
    @Body() dto: ResidentAppPushTokenDto,
  ) {
    return this.register(request.user, dto);
  }

  @Post('fcm-token')
  @HttpCode(HttpStatus.OK)
  async registerToken(
    @Req() request: { user: ResidentSessionClaims },
    @Body() dto: ResidentAppPushTokenDto,
  ) {
    return this.register(request.user, dto);
  }

  @Delete('push-token/:deviceId')
  @HttpCode(HttpStatus.OK)
  async revokePushToken(
    @Req() request: { user: ResidentSessionClaims },
    @Param('deviceId') deviceId: string,
  ) {
    return this.revoke(request.user, deviceId);
  }

  @Delete('fcm-token/:deviceId')
  @HttpCode(HttpStatus.OK)
  async revokeToken(
    @Req() request: { user: ResidentSessionClaims },
    @Param('deviceId') deviceId: string,
  ) {
    return this.revoke(request.user, deviceId);
  }

  private async register(user: ResidentSessionClaims, dto: ResidentAppPushTokenDto) {
    const result = await this.authRepository.registerResidentPushToken(user, dto);
    return {
      success: true,
      message: null,
      data: result,
    };
  }

  private async revoke(user: ResidentSessionClaims, deviceId: string) {
    const result = await this.authRepository.revokeResidentPushToken(user, deviceId);
    return {
      success: true,
      message: null,
      data: result,
    };
  }
}
