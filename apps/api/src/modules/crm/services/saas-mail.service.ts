import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { join } from 'node:path';

export interface RenewalNoticeEmail {
  tenantName: string;
  currentAmount: number;
  renewalAmount: number;
  billingInterval: 'MONTHLY' | 'ANNUAL';
  currentPeriodEnd: Date;
  preview?: boolean;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

function formatAmount(amount: number) {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
}

function renewalEmailContent(notice: RenewalNoticeEmail) {
  const date = new Date(notice.currentPeriodEnd).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const period = notice.billingInterval === 'ANNUAL' ? 'anual' : 'mensual';
  const currentAmount = formatAmount(notice.currentAmount);
  const renewalAmount = formatAmount(notice.renewalAmount);
  const name = escapeHtml(notice.tenantName);
  const text = `${notice.preview ? 'VISTA PREVIA. Este correo de prueba no registra ni reenvía un aviso contractual.\n\n' : ''}Hola, administración de ${notice.tenantName}:\n\nTe informamos que, a partir de la renovación de tu suscripción el ${date}, la tarifa ${period} será de ${renewalAmount}. Tu precio actual de ${currentAmount} se mantiene hasta esa fecha.\n\nSi tienes alguna pregunta, responde a este correo.\n\nEquipo Dommia`;
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;color:#0F172A;font-family:Manrope,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;">Tu tarifa actual se mantiene hasta el ${escapeHtml(date)}. Consulta el importe de tu próxima renovación.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#F8FAFC;"><tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;max-width:600px;background:#FFFFFF;">
      <tr><td style="background:#0F172A;padding:22px 32px;border-bottom:4px solid #2563EB;">
        <img src="cid:dommia-logo@dommia" width="162" height="43" alt="Dommia Communities" style="display:block;border:0;max-width:100%;height:auto;color:#FFFFFF;font-size:20px;font-weight:bold;">
      </td></tr>
      ${notice.preview ? '<tr><td style="padding:12px 32px;background:#DBEAFE;color:#1E3A8A;font-size:13px;font-weight:700;">VISTA PREVIA · Este correo de prueba no registra ni reenvía un aviso contractual.</td></tr>' : ''}
      <tr><td style="padding:32px 32px 12px;">
        <p style="margin:0 0 12px;color:#2563EB;font-size:12px;font-weight:700;">Aviso de renovación</p>
        <h1 style="margin:0 0 16px;color:#0F172A;font-size:26px;line-height:1.25;font-weight:700;">Tu próxima tarifa, con tiempo para planear</h1>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.65;">Hola, administración de <strong style="color:#0F172A;">${name}</strong>:</p>
        <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.65;">Te notificamos el importe que aplicará a partir de la siguiente renovación de tu suscripción Dommia.</p>
      </td></tr>
      <tr><td style="padding:0 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #CBD5E1;">
          <tr><td colspan="2" style="padding:15px 18px;background:#F8FAFC;border-bottom:1px solid #CBD5E1;color:#0F172A;font-size:14px;font-weight:700;">Resumen de tu renovación</td></tr>
          <tr><td style="padding:18px 16px 8px 18px;width:50%;vertical-align:top;color:#475569;font-size:12px;">Tarifa actual</td><td style="padding:18px 18px 8px 16px;width:50%;vertical-align:top;color:#475569;font-size:12px;">Nueva tarifa</td></tr>
          <tr><td style="padding:0 16px 20px 18px;vertical-align:top;color:#0F172A;font-size:17px;line-height:1.3;font-weight:700;">${currentAmount}</td><td style="padding:0 18px 20px 16px;vertical-align:top;color:#2563EB;font-size:17px;line-height:1.3;font-weight:700;">${renewalAmount}</td></tr>
          <tr><td colspan="2" style="padding:15px 18px;border-top:1px solid #E2E8F0;color:#334155;font-size:14px;line-height:1.6;"><strong style="color:#0F172A;">Vigente a partir del:</strong> ${escapeHtml(date)}<br><strong style="color:#0F172A;">Periodicidad:</strong> ${period}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:24px 32px 32px;">
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.65;">Tu tarifa actual se mantiene durante todo el periodo ya pagado, hasta el <strong style="color:#0F172A;">${escapeHtml(date)}</strong>.</p>
        <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">Si tienes alguna pregunta sobre este aviso, responde directamente a este correo.</p>
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #E2E8F0;background:#F8FAFC;color:#475569;font-size:12px;line-height:1.5;">Equipo Dommia &nbsp;·&nbsp; Administración de comunidades</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
  return { text, html };
}

@Injectable()
export class SaasMailService {
  private readonly logger = new Logger(SaasMailService.name);

  async sendRenewalNotice(recipient: string, notice: RenewalNoticeEmail) {
    const host = process.env.SAAS_SMTP_HOST;
    const user = process.env.SAAS_SMTP_USER;
    const password = process.env.SAAS_SMTP_PASSWORD;
    const from = process.env.SAAS_SMTP_FROM || user;
    const port = Number(process.env.SAAS_SMTP_PORT || 587);

    if (!host || !user || !password || !from || ![465, 587].includes(port)) {
      throw new ServiceUnavailableException('Configura el SMTP de Dommia antes de enviar avisos de renovación.');
    }

    try {
      const transport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: { user, pass: password },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      const { text, html } = renewalEmailContent(notice);
      const result = await transport.sendMail({
        from,
        to: recipient,
        subject: `${notice.preview ? '[Prueba] ' : ''}Aviso de renovación de tu suscripción Dommia`,
        text,
        html,
        attachments: [{ filename: 'dommia.png', path: join(__dirname, '../../../../email-logo.png'), cid: 'dommia-logo@dommia' }],
      });
      if (!result.accepted?.length || result.rejected?.length) {
        throw new Error('El servidor SMTP rechazó al destinatario.');
      }
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
        ? error.code
        : 'UNKNOWN';
      this.logger.warn(`No se pudo enviar el aviso SaaS por SMTP (código: ${/^[A-Z_]+$/.test(code) ? code : 'UNKNOWN'}).`);
      throw new ServiceUnavailableException('No se pudo entregar el aviso por SMTP. No se registró como enviado.');
    }
  }
}