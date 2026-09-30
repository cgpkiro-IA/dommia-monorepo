import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

export interface TelegramConfig {
  enabled: boolean;
  botToken?: string;
  chatId?: string;
  botUsername?: string;
  lastTestedAt?: string;
  lastError?: string;
}

export interface PlatformAlertPayload {
  id?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'CHANNELS' | 'SECURITY' | 'BILLING' | 'SYSTEM' | 'TELEMETRY';
  title: string;
  description: string;
  tenantSlug?: string;
}

@Injectable()
export class TelegramAlertService {
  private readonly logger = new Logger(TelegramAlertService.name);

  constructor(private readonly db: DatabaseService) {}

  async getConfig(): Promise<TelegramConfig> {
    const result = await this.db.query(`
      SELECT bot_token, chat_id, enabled, bot_username, last_tested_at, last_error
      FROM public.crm_telegram_config
      WHERE id = 'default'
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return {
        enabled: false,
        botToken: '',
        chatId: '',
        botUsername: '',
      };
    }

    const row = result.rows[0];
    return {
      enabled: Boolean(row.enabled),
      botToken: row.bot_token ? `${row.bot_token.slice(0, 8)}...${row.bot_token.slice(-4)}` : '',
      chatId: row.chat_id || '',
      botUsername: row.bot_username || '',
      lastTestedAt: row.last_tested_at ? new Date(row.last_tested_at).toISOString() : undefined,
      lastError: row.last_error || undefined,
    };
  }

  async getRawConfig(): Promise<{ botToken: string; chatId: string; enabled: boolean }> {
    const result = await this.db.query(`
      SELECT bot_token, chat_id, enabled
      FROM public.crm_telegram_config
      WHERE id = 'default'
      LIMIT 1
    `);
    if (result.rows.length === 0) {
      return { botToken: '', chatId: '', enabled: false };
    }
    return {
      botToken: result.rows[0].bot_token || '',
      chatId: result.rows[0].chat_id || '',
      enabled: Boolean(result.rows[0].enabled),
    };
  }

  async saveConfig(dto: {
    enabled: boolean;
    botToken?: string;
    chatId?: string;
    botUsername?: string;
  }): Promise<TelegramConfig> {
    const current = await this.getRawConfig();
    const newBotToken = dto.botToken && !dto.botToken.includes('...') ? dto.botToken.trim() : current.botToken;
    const newChatId = dto.chatId !== undefined ? dto.chatId.trim() : current.chatId;

    await this.db.query(`
      INSERT INTO public.crm_telegram_config (id, bot_token, chat_id, enabled, bot_username, updated_at)
      VALUES ('default', $1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET
        bot_token = EXCLUDED.bot_token,
        chat_id = EXCLUDED.chat_id,
        enabled = EXCLUDED.enabled,
        bot_username = EXCLUDED.bot_username,
        updated_at = NOW()
    `, [newBotToken, newChatId, dto.enabled, dto.botUsername?.trim() || null]);

    return this.getConfig();
  }

  async sendAlert(alert: PlatformAlertPayload): Promise<boolean> {
    const config = await this.getRawConfig();
    if (!config.enabled || !config.botToken || !config.chatId) {
      this.logger.debug(`Telegram no configurado o deshabilitado para alerta: ${alert.title}`);
      return false;
    }

    const severityEmoji = alert.severity === 'CRITICAL' ? '🚨 🔴 *CRÍTICA*' : alert.severity === 'WARNING' ? '⚠️ 🟡 *ADVERTENCIA*' : 'ℹ️ 🔵 *INFORMATIVA*';
    const tenantTag = alert.tenantSlug ? `🏢 *Fraccionamiento:* \`${alert.tenantSlug}\`` : '🌐 *Ámbito:* `PLATAFORMA GLOBAL`';
    const timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    const message = [
      `🛡️ *DOMMIA PLATFORM ALERT*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*Severidad:* ${severityEmoji}`,
      `*Categoría:* \`${alert.category}\``,
      tenantTag,
      `*Evento:* *${escapeTelegramMarkdown(alert.title)}*`,
      `*Detalle:* ${escapeTelegramMarkdown(alert.description)}`,
      `*Hora:* _${timestamp}_`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `_Dommia CRM Maestro • Centro de Alertas_`,
    ].join('\n');

    try {
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        const errorDesc = data.description || `HTTP ${response.status}`;
        this.logger.warn(`Error al enviar mensaje a Telegram: ${errorDesc}`);
        await this.recordLastError(errorDesc);
        return false;
      }

      await this.recordSuccess();
      return true;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Error de red con Telegram';
      this.logger.error(`Fallo al despachar alerta a Telegram: ${errMessage}`);
      await this.recordLastError(errMessage);
      return false;
    }
  }

  async testNotification(botToken?: string, chatId?: string): Promise<{ success: boolean; message: string }> {
    const current = await this.getRawConfig();
    const token = botToken && !botToken.includes('...') ? botToken.trim() : current.botToken;
    const targetChat = chatId ? chatId.trim() : current.chatId;

    if (!token || !targetChat) {
      return {
        success: false,
        message: 'Debes proporcionar un Bot Token y un Chat ID válidos para realizar la prueba.',
      };
    }

    const timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    const text = [
      `🔔 *DOMMIA CRM MAESTRO — PRUEBA DE CONEXIÓN*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `✅ *¡El Bot de Telegram está conectado y funcionando correctamente!*`,
      `A partir de este momento, las alertas de la plataforma se enviarán a este canal.`,
      `*Hora de prueba:* _${timestamp}_`,
      `━━━━━━━━━━━━━━━━━━━━`,
    ].join('\n');

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChat,
          text,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        const errorDesc = data.description || `HTTP ${response.status}`;
        await this.recordLastError(errorDesc);
        return {
          success: false,
          message: `Telegram rechazó la petición: ${errorDesc}`,
        };
      }

      await this.recordSuccess();
      return {
        success: true,
        message: '¡Mensaje de prueba enviado exitosamente a Telegram!',
      };
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Fallo de conexión';
      await this.recordLastError(err);
      return {
        success: false,
        message: `No se pudo conectar con el API de Telegram: ${err}`,
      };
    }
  }

  private async recordLastError(error: string) {
    try {
      await this.db.query(`
        UPDATE public.crm_telegram_config
        SET last_error = $1, updated_at = NOW()
        WHERE id = 'default'
      `, [error]);
    } catch {}
  }

  private async recordSuccess() {
    try {
      await this.db.query(`
        UPDATE public.crm_telegram_config
        SET last_tested_at = NOW(), last_error = NULL, updated_at = NOW()
        WHERE id = 'default'
      `);
    } catch {}
  }
}

function escapeTelegramMarkdown(text: string): string {
  return text.replace(/([_*\[\]`])/g, '\\$1');
}
