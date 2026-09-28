import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import Stripe from 'stripe';
import { BillingEngineRepository } from '../../finance/repositories/billing-engine.repository';
import { BillingEngineService } from '../../finance/services/billing-engine.service';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { StripeRepository } from '../repositories/stripe.repository';
import { CreateStripeCheckoutDto } from '../dto/stripe.dto';

@Injectable()
export class StripeService {
  private readonly stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

  constructor(
    private readonly stripeRepository: StripeRepository,
    private readonly tenantsRepo: TenantsRepository,
    private readonly billingRepo: BillingEngineRepository,
    private readonly billingService: BillingEngineService,
  ) {}

  private hasStripe(modules: string[] | Record<string, boolean> | null | undefined) {
    return Array.isArray(modules)
      ? modules.some((module) => ['STRIPE', 'STRIPE_CONNECT', 'FINANCE_STRIPE'].includes(module))
      : Boolean(modules && Object.entries(modules).some(([key, enabled]) => enabled && ['STRIPE', 'STRIPE_CONNECT', 'FINANCE_STRIPE'].includes(key)));
  }

  private async tenantOrFail(slug: string) {
    const tenant = await this.tenantsRepo.findByExactSlug(slug);
    if (!tenant) throw new NotFoundException('Fraccionamiento no encontrado.');
    if (!this.hasStripe(tenant.modules)) throw new ForbiddenException('Stripe no está contratado para este fraccionamiento.');
    if (!this.stripe) throw new ForbiddenException('Stripe no está configurado en este entorno.');
    return tenant;
  }

  async createCheckout(slug: string, dto: CreateStripeCheckoutDto, residentPropertyId: string) {
    const tenant = await this.tenantOrFail(slug);
    if (dto.propertyId !== residentPropertyId) throw new UnauthorizedException('La propiedad no pertenece a la sesión Resident.');
    const charge = await this.billingRepo.findChargeById(tenant.slug, dto.chargeId);
    if (!charge || charge.property_id !== dto.propertyId) throw new NotFoundException('Cargo no encontrado para la propiedad.');
    const amount = Math.round(Number(charge.balance_due) * 100);
    if (amount <= 0) throw new ForbiddenException('El cargo ya está liquidado.');
    const session = await this.stripe!.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'mxn', product_data: { name: charge.concept }, unit_amount: amount }, quantity: 1 }],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      metadata: { tenantSlug: tenant.slug, propertyId: dto.propertyId, chargeId: dto.chargeId },
      payment_intent_data: { metadata: { tenantSlug: tenant.slug, propertyId: dto.propertyId, chargeId: dto.chargeId } },
    });
    return { sessionId: session.id, checkoutUrl: session.url };
  }

  async createConnectOnboarding(slug: string, returnUrl: string, refreshUrl: string) {
    const tenant = await this.tenantOrFail(slug);
    const existingAccountId = await this.stripeRepository.findConnectedAccountId(tenant.id);
    const accountId = existingAccountId || (await this.stripe!.accounts.create({ type: 'express', capabilities: { card_payments: { requested: true }, transfers: { requested: true } }, metadata: { tenantSlug: tenant.slug } })).id;
    if (!existingAccountId) await this.stripeRepository.createConnectedAccount(tenant.id, accountId);
    const link = await this.stripe!.accountLinks.create({ account: accountId, refresh_url: refreshUrl, return_url: returnUrl, type: 'account_onboarding' });
    return { accountId, onboardingUrl: link.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) throw new ForbiddenException('Stripe webhook no configurado.');
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    const inserted = await this.stripeRepository.registerWebhookEvent(event.id, event.type);
    if (!inserted) return { received: true, duplicate: true };
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      if (metadata.tenantSlug && metadata.propertyId && metadata.chargeId && session.amount_total) {
        await this.billingService.recordPayment(metadata.tenantSlug, {
          propertyId: metadata.propertyId,
          chargeId: metadata.chargeId,
          amount: session.amount_total / 100,
          paymentMethod: 'STRIPE_CARD',
          reference: `STRIPE-${session.payment_intent || session.id}`,
          notes: `Stripe Checkout Session ${session.id}`,
          payerName: session.customer_details?.name || session.customer_details?.email || undefined,
        });
      }
    }
    return { received: true, duplicate: false };
  }

  async getCheckoutStatus(slug: string, sessionId: string, residentPropertyId: string) {
    const tenant = await this.tenantOrFail(slug);
    const session = await this.stripe!.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.tenantSlug !== tenant.slug || session.metadata?.propertyId !== residentPropertyId) {
      throw new UnauthorizedException('La sesión de pago no pertenece a esta cuenta Resident.');
    }
    return {
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      verified: true,
      creditingSource: 'STRIPE_WEBHOOK',
    };
  }
}
