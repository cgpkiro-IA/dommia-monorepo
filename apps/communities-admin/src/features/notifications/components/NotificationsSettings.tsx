'use client';

import React, { useEffect, useState } from 'react';
import { parseClientError } from '@dommia/ui';
import { Mail, MessageCircle, Save, ShieldCheck } from 'lucide-react';
import { API_BASE as API } from '@/lib/api-url';

interface Props {
  tenantSlug: string;
  authToken: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

interface ChannelStatus {
  channel: 'SMTP' | 'WHATSAPP_BUSINESS';
  enabled: boolean;
  configured: boolean;
  updatedAt: string;
}

export function NotificationsSettings({ tenantSlug, authToken, showToast }: Props) {
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'SMTP' | 'WHATSAPP_BUSINESS' | null>(null);
  const [smtp, setSmtp] = useState({ enabled: false, smtpHost: '', smtpPort: 587, smtpSecure: true, smtpUser: '', smtpPassword: '', fromEmail: '', fromName: 'Dommia Resident' });
  const [whatsapp, setWhatsapp] = useState({ enabled: false, whatsappAccessToken: '', whatsappPhoneNumberId: '', whatsappBusinessAccountId: '', whatsappApiVersion: 'v22.0' });

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

  useEffect(() => {
    let mounted = true;
    fetch(`${API}/tenants/${tenantSlug}/notifications/config`, { headers })
      .then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          const parsed = parseClientError(json || { status: response.status }, 'No se pudo consultar la configuración.');
          throw new Error(parsed.description);
        }
        if (mounted) setChannels(json.data?.channels || []);
      })
      .catch((error) => {
        const parsed = parseClientError(error, 'No se pudo consultar la configuración.');
        showToast(parsed.description, 'error');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [tenantSlug, authToken]);

  const save = async (channel: 'SMTP' | 'WHATSAPP_BUSINESS', data: Record<string, unknown>) => {
    setSaving(channel);
    try {
      const response = await fetch(`${API}/tenants/${tenantSlug}/notifications/config`, { method: 'PATCH', headers, body: JSON.stringify({ channel, ...data }) });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const parsed = parseClientError(json || { status: response.status }, 'No se pudo guardar la configuración.');
        throw new Error(parsed.description);
      }
      setChannels((current) => [...current.filter((item) => item.channel !== channel), { channel, enabled: Boolean(data.enabled), configured: true, updatedAt: json.data?.updated_at }]);
      showToast(`${channel === 'SMTP' ? 'SMTP' : 'WhatsApp Business'} configurado correctamente.`);
      if (channel === 'SMTP') setSmtp((current) => ({ ...current, smtpPassword: '' }));
      else setWhatsapp((current) => ({ ...current, whatsappAccessToken: '' }));
    } catch (error) {
      const parsed = parseClientError(error, 'No se pudo guardar la configuración.');
      showToast(parsed.description, 'error');
    } finally { setSaving(null); }
  };

  const status = (channel: ChannelStatus['channel']) => channels.find((item) => item.channel === channel);
  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Cargando configuración de notificaciones...</div>;

  return <section className="space-y-6">
    <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-700" /><div><h2 className="text-lg font-black text-indigo-950">Notificaciones Premium</h2><p className="mt-1 text-sm text-indigo-800">Configura los canales para enviar invitaciones y avisos a residentes. Las credenciales se cifran y no vuelven a mostrarse.</p></div></div></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><Mail className="h-5 w-5 text-blue-600" /><h3 className="font-black text-slate-900">Correo SMTP</h3></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${status('SMTP')?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{status('SMTP')?.enabled ? 'Activo' : 'No configurado'}</span></div><div className="grid gap-3 sm:grid-cols-2"><input placeholder="Servidor SMTP" value={smtp.smtpHost} onChange={(event) => setSmtp({ ...smtp, smtpHost: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input type="number" placeholder="Puerto" value={smtp.smtpPort} onChange={(event) => setSmtp({ ...smtp, smtpPort: Number(event.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Usuario SMTP" value={smtp.smtpUser} onChange={(event) => setSmtp({ ...smtp, smtpUser: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input type="password" placeholder="Contraseña SMTP" value={smtp.smtpPassword} onChange={(event) => setSmtp({ ...smtp, smtpPassword: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input type="email" placeholder="Correo remitente" value={smtp.fromEmail} onChange={(event) => setSmtp({ ...smtp, fromEmail: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Nombre remitente" value={smtp.fromName} onChange={(event) => setSmtp({ ...smtp, fromName: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /></div><label className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={smtp.smtpSecure} onChange={(event) => setSmtp({ ...smtp, smtpSecure: event.target.checked })} /> Usar conexión segura TLS</label><button type="button" disabled={saving === 'SMTP'} onClick={() => save('SMTP', smtp)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving === 'SMTP' ? 'Guardando...' : 'Guardar SMTP'}</button></div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-emerald-600" /><h3 className="font-black text-slate-900">WhatsApp Business</h3></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${status('WHATSAPP_BUSINESS')?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{status('WHATSAPP_BUSINESS')?.enabled ? 'Activo' : 'No configurado'}</span></div><div className="space-y-3"><input placeholder="Access Token" type="password" value={whatsapp.whatsappAccessToken} onChange={(event) => setWhatsapp({ ...whatsapp, whatsappAccessToken: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Phone Number ID" value={whatsapp.whatsappPhoneNumberId} onChange={(event) => setWhatsapp({ ...whatsapp, whatsappPhoneNumberId: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input placeholder="Business Account ID" value={whatsapp.whatsappBusinessAccountId} onChange={(event) => setWhatsapp({ ...whatsapp, whatsappBusinessAccountId: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input placeholder="API Version" value={whatsapp.whatsappApiVersion} onChange={(event) => setWhatsapp({ ...whatsapp, whatsappApiVersion: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></div><button type="button" disabled={saving === 'WHATSAPP_BUSINESS'} onClick={() => save('WHATSAPP_BUSINESS', whatsapp)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving === 'WHATSAPP_BUSINESS' ? 'Guardando...' : 'Guardar WhatsApp'}</button></div>
    </div>
  </section>;
}
