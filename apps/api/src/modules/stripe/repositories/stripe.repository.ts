import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class StripeRepository {
  constructor(private readonly db: DatabaseService) {}

  async findConnectedAccountId(tenantId: string): Promise<string | null> {
    const result = await this.db.query(
      'SELECT account_id FROM public.stripe_connected_accounts WHERE tenant_id = $1',
      [tenantId],
    );
    return result.rows[0]?.account_id || null;
  }

  async createConnectedAccount(tenantId: string, accountId: string) {
    await this.db.query(
      'INSERT INTO public.stripe_connected_accounts (tenant_id, account_id) VALUES ($1, $2)',
      [tenantId, accountId],
    );
  }

  async registerWebhookEvent(eventId: string, eventType: string): Promise<boolean> {
    const result = await this.db.query(
      'INSERT INTO public.stripe_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING RETURNING event_id',
      [eventId, eventType],
    );
    return Boolean(result.rows[0]);
  }
}