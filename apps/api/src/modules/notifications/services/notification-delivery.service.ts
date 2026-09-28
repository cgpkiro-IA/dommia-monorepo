import { BadRequestException, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { NotificationsRepository } from '../repositories/notifications.repository';

interface InvitationMessage {
  residentName: string;
  communityName: string;
  activationUrl: string;
  expiresAt: string;
}

export interface AccessGrantedMessage {
  visitorName: string;
  communityName: string;
  propertyAddress: string;
  accessTime: string;
}

export type AccessNotificationStatus = 'SENT_WHATSAPP' | 'SENT_EMAIL' | 'NOT_CONFIGURED' | 'FAILED';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

@Injectable()
export class NotificationDeliveryService {
  constructor(
    private readonly tenantsRepo: TenantsRepository,
    private readonly notificationsRepo: NotificationsRepository,
  ) {}

  private async tenantAndChannel(slug: string, channel: 'SMTP' | 'WHATSAPP_BUSINESS') {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) throw new BadRequestException('Fraccionamiento no encontrado.');
    const modules = tenant.modules;
    const premium = Array.isArray(modules) ? modules.includes('NOTIFICATIONS_PREMIUM') : Boolean(modules?.NOTIFICATIONS_PREMIUM);
    if (!premium) throw new BadRequestException('Las notificaciones premium no están contratadas.');
    const configuration = await this.notificationsRepo.findChannelConfig(tenant.id, channel);
    if (!configuration?.enabled) throw new BadRequestException(`El canal ${channel} no está configurado o habilitado.`);
    return { tenant, config: configuration.config as Record<string, string | number | boolean> };
  }

  private html(message: InvitationMessage) {
    return `<div style="font-family:Arial,sans-serif;color:#0f172a;max-width:620px;margin:auto"><h1 style="color:#2563eb">Activa tu acceso a Dommia Resident</h1><p>Hola <strong>${message.residentName}</strong>:</p><p>La administración de <strong>${message.communityName}</strong> habilitó tu cuenta Resident.</p><h2>Con tu cuenta podrás:</h2><ul><li>Consultar cuotas y estados de cuenta.</li><li>Recibir avisos de tu comunidad.</li><li>Generar invitaciones para visitantes.</li><li>Consultar tu información residencial.</li><li>Usar accesos digitales cuando estén habilitados.</li></ul><p><a href="${message.activationUrl}" style="display:inline-block;background:#2563eb;color:white;padding:14px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Activar mi cuenta</a></p><p style="font-size:12px;color:#64748b">El enlace expira el ${message.expiresAt} y solo puede utilizarse una vez.</p><p style="font-size:12px;color:#64748b">Si no solicitaste este acceso, ignora este mensaje y contacta a la administración.</p></div>`;
  }

  private text(message: InvitationMessage) {
    return `Hola ${message.residentName}. La administración de ${message.communityName} habilitó tu acceso a Dommia Resident. Actívalo aquí: ${message.activationUrl}. El enlace expira el ${message.expiresAt}. Beneficios: cuotas, avisos, invitaciones y accesos digitales.`;
  }

  async sendAccessGranted(
    slug: string,
    contacts: { email: string | null; phone: string | null },
    message: AccessGrantedMessage,
  ): Promise<AccessNotificationStatus> {
    const tenant = await this.tenantsRepo.findBySlug(slug);
    if (!tenant) return 'NOT_CONFIGURED';
    const modules = tenant.modules;
    const premiumEnabled = Array.isArray(modules)
      ? modules.includes('NOTIFICATIONS_PREMIUM')
      : Boolean(modules && typeof modules === 'object' && modules['NOTIFICATIONS_PREMIUM'] === true);
    if (!premiumEnabled) return 'NOT_CONFIGURED';

    const text = `Aviso de acceso: ${message.visitorName} ingresó a ${message.communityName}. Destino: ${message.propertyAddress}. Hora: ${message.accessTime}.`;
    let deliveryFailed = false;

    if (contacts.phone) {
      try {
        const { config } = await this.tenantAndChannel(slug, 'WHATSAPP_BUSINESS');
        const version = String(config.whatsappApiVersion || 'v22.0');
        const response = await fetch(`https://graph.facebook.com/${version}/${config.whatsappPhoneNumberId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${config.whatsappAccessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: contacts.phone.replace(/[^0-9]/g, ''),
            type: 'text',
            text: { preview_url: false, body: text },
          }),
        });
        if (!response.ok) throw new Error('WhatsApp Business rejected access notification.');
        return 'SENT_WHATSAPP';
      } catch {
        deliveryFailed = true;
      }
    }

    if (contacts.email) {
      try {
        const { config } = await this.tenantAndChannel(slug, 'SMTP');
        const transporter = nodemailer.createTransport({
          host: String(config.smtpHost),
          port: Number(config.smtpPort || 587),
          secure: Boolean(config.smtpSecure),
          auth: { user: String(config.smtpUser), pass: String(config.smtpPassword) },
        });
        const visitorName = escapeHtml(message.visitorName);
        const communityName = escapeHtml(message.communityName);
        const propertyAddress = escapeHtml(message.propertyAddress);
        const accessTime = escapeHtml(message.accessTime);
        await transporter.sendMail({
          from: config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : String(config.fromEmail),
          to: contacts.email,
          subject: `Acceso registrado en ${message.communityName}`,
          text,
          html: `<div style="font-family:Arial,sans-serif;color:#0f172a;max-width:620px;margin:auto"><h1 style="color:#2563eb">Acceso registrado</h1><p>Hola, te informamos que <strong>${visitorName}</strong> ingresó a <strong>${communityName}</strong>.</p><p>Destino: <strong>${propertyAddress}</strong><br>Hora: ${accessTime}</p></div>`,
        });
        return 'SENT_EMAIL';
      } catch {
        deliveryFailed = true;
      }
    }

    return deliveryFailed ? 'FAILED' : 'NOT_CONFIGURED';
  }

  async sendEmail(slug: string, recipient: string, message: InvitationMessage) {
    const { config } = await this.tenantAndChannel(slug, 'SMTP');
    const transporter = nodemailer.createTransport({ host: String(config.smtpHost), port: Number(config.smtpPort || 587), secure: Boolean(config.smtpSecure), auth: { user: String(config.smtpUser), pass: String(config.smtpPassword) } });
    await transporter.sendMail({ from: config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : String(config.fromEmail), to: recipient, subject: `Activa tu acceso a ${message.communityName}`, text: this.text(message), html: this.html(message) });
  }

  async sendWhatsApp(slug: string, recipient: string, message: InvitationMessage) {
    const { config } = await this.tenantAndChannel(slug, 'WHATSAPP_BUSINESS');
    const version = String(config.whatsappApiVersion || 'v22.0');
    const response = await fetch(`https://graph.facebook.com/${version}/${config.whatsappPhoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${config.whatsappAccessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: recipient.replace(/[^0-9]/g, ''), type: 'text', text: { preview_url: true, body: this.text(message) } }) });
    if (!response.ok) throw new BadRequestException('WhatsApp Business rechazó el envío. Verifica el token y el Phone Number ID.');
  }

  async sendRecovery(slug: string, channel: 'EMAIL' | 'WHATSAPP', recipient: string, message: InvitationMessage) {
    if (channel === 'EMAIL') await this.sendEmail(slug, recipient, message);
    else await this.sendWhatsApp(slug, recipient, message);
  }
}