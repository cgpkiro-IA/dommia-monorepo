import { IsNotEmpty, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateStripeCheckoutDto {
  @IsUUID('4')
  propertyId: string;

  @IsUUID('4')
  chargeId: string;

  @IsUrl({ require_tld: false })
  successUrl: string;

  @IsUrl({ require_tld: false })
  cancelUrl: string;
}

export class StripeWebhookDto {
  @IsString()
  @IsNotEmpty()
  signature: string;
}

export class StripeConnectLinkDto {
  @IsUrl({ require_tld: false })
  returnUrl: string;

  @IsUrl({ require_tld: false })
  refreshUrl: string;
}
