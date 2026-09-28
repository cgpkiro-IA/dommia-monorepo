import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly db: DatabaseService) {}

  async ensureTable() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS public.notification_channel_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
        channel VARCHAR(32) NOT NULL CHECK (channel IN ('SMTP', 'WHATSAPP_BUSINESS')),
        enabled BOOLEAN NOT NULL DEFAULT false,
        config_encrypted TEXT NOT NULL,
        updated_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (tenant_id, channel)
      )
    `);
  }

  async findChannels(tenantId: string) {
    await this.ensureTable();
    const result = await this.db.query(
      `SELECT channel, enabled, updated_at FROM public.notification_channel_configs WHERE tenant_id = $1 ORDER BY channel`,
      [tenantId],
    );
    return result.rows;
  }

  async findChannelConfig(tenantId: string, channel: string) {
    await this.ensureTable();
    const encryptionKey = process.env.NOTIFICATIONS_ENCRYPTION_KEY || (process.env.NODE_ENV === 'production' ? null : 'dommia-local-notifications-key-change-me');
    if (!encryptionKey) throw new Error('NOTIFICATIONS_ENCRYPTION_KEY es obligatoria en producción.');
    const result = await this.db.query(
      `SELECT channel, enabled, pgp_sym_decrypt(config_encrypted::bytea, $2) AS config
       FROM public.notification_channel_configs WHERE tenant_id = $1 AND channel = $3`,
      [tenantId, encryptionKey, channel],
    );
    if (!result.rows[0]) return null;
    return { ...result.rows[0], config: JSON.parse(result.rows[0].config) };
  }

  async upsert(tenantId: string, channel: string, enabled: boolean, config: Record<string, unknown>, updatedBy?: string) {
    await this.ensureTable();
    const encryptionKey = process.env.NOTIFICATIONS_ENCRYPTION_KEY || (process.env.NODE_ENV === 'production' ? null : 'dommia-local-notifications-key-change-me');
    if (!encryptionKey) {
      throw new Error('NOTIFICATIONS_ENCRYPTION_KEY es obligatoria en producción.');
    }
    const result = await this.db.query(
      `INSERT INTO public.notification_channel_configs (tenant_id, channel, enabled, config_encrypted, updated_by)
       VALUES ($1, $2, $3, pgp_sym_encrypt($4, $5), $6)
       ON CONFLICT (tenant_id, channel) DO UPDATE SET enabled = EXCLUDED.enabled,
         config_encrypted = EXCLUDED.config_encrypted, updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING channel, enabled, updated_at`,
      [tenantId, channel, enabled, JSON.stringify(config), encryptionKey, updatedBy || null],
    );
    return result.rows[0];
  }

  async remove(tenantId: string, channel: string) {
    await this.ensureTable();
    await this.db.query('DELETE FROM public.notification_channel_configs WHERE tenant_id = $1 AND channel = $2', [tenantId, channel]);
  }
}