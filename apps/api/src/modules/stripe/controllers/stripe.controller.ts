import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { FinanceAdminGuard } from '../../auth/guards/finance-admin.guard';
import { ResidentAuthGuard, ResidentSessionClaims } from '../../auth/guards/resident-auth.guard';
import { CreateStripeCheckoutDto, StripeConnectLinkDto } from '../dto/stripe.dto';
import { StripeService } from '../services/stripe.service';
import { Public, Roles } from '../../auth/decorators/auth-metadata.decorator';

@Controller()
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('tenants/:slug/stripe/checkout')
  @Roles('RESIDENT')
  @UseGuards(ResidentAuthGuard)
  async checkout(@Param('slug') slug: string, @Body() dto: CreateStripeCheckoutDto, @Req() request: { user: ResidentSessionClaims }) {
    return { success: true, data: await this.stripeService.createCheckout(slug, dto, request.user.propertyId) };
  }

  @Get('tenants/:slug/stripe/session/:sessionId')
  @Roles('RESIDENT')
  @UseGuards(ResidentAuthGuard)
  async checkoutStatus(@Param('slug') slug: string, @Param('sessionId') sessionId: string, @Req() request: { user: ResidentSessionClaims }) {
    return { success: true, data: await this.stripeService.getCheckoutStatus(slug, sessionId, request.user.propertyId) };
  }

  @Post('stripe/webhook')
  @Public()
  async webhook(@Req() request: { rawBody?: Buffer }, @Headers('stripe-signature') signature: string) {
    return this.stripeService.handleWebhook(request.rawBody || Buffer.from(''), signature);
  }

  @Post('tenants/:slug/stripe/connect')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATOR')
  @UseGuards(FinanceAdminGuard)
  async connect(@Param('slug') slug: string, @Body() dto: StripeConnectLinkDto) {
    return { success: true, data: await this.stripeService.createConnectOnboarding(slug, dto.returnUrl, dto.refreshUrl) };
  }
}
