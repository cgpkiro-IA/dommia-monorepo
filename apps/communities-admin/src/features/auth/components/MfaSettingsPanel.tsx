'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { API_BASE as API } from '@/lib/api-url';
interface SetupData { secret: string; qrCodeDataUrl: string }

interface MfaSettingsPanelProps {
  authToken: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function MfaSettingsPanel({ authToken, showToast }: MfaSettingsPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/mfa/status`, { headers });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo consultar la seguridad de la cuenta.');
      setEnabled(Boolean(result.data.enabled));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'No se pudo consultar la seguridad de la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadStatus(); }, [authToken]);

  const request = async (path: string, body: Record<string, string>) => {
    const response = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo actualizar la configuración.');
    return result.data;
  };

  const startSetup = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { setSetup(await request('/auth/mfa/setup', { password }) as SetupData); setPassword(''); }
    catch (setupError) { setError(setupError instanceof Error ? setupError.message : 'No se pudo iniciar la configuración.'); }
    finally { setBusy(false); }
  };

  const enable = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await request('/auth/mfa/enable', { code: code.replace(/\s/g, '') });
      setEnabled(true); setSetup(null); setCode('');
      showToast('Segundo factor activado. Se solicitará en tu próximo inicio de sesión.');
    } catch (enableError) { setError(enableError instanceof Error ? enableError.message : 'No se pudo activar el segundo factor.'); }
    finally { setBusy(false); }
  };

  const disable = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await request('/auth/mfa/disable', { password, code: code.replace(/\s/g, '') });
      setEnabled(false); setPassword(''); setCode('');
      showToast('Segundo factor desactivado.');
    } catch (disableError) { setError(disableError instanceof Error ? disableError.message : 'No se pudo desactivar el segundo factor.'); }
    finally { setBusy(false); }
  };

  const copySecret = async () => {
    if (!setup) return;
    await navigator.clipboard.writeText(setup.secret); setCopied(true);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6" aria-labelledby="community-mfa-heading">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><ShieldCheck aria-hidden="true" /></span>
        <div><h1 id="community-mfa-heading" className="text-lg font-bold text-slate-900">Autenticación de dos pasos</h1><p className="mt-1 max-w-2xl text-sm text-slate-600">Activa un código de Microsoft Authenticator después de tu contraseña. Esta opción es voluntaria y aplica a tu cuenta administrativa.</p></div>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading ? <p className="mt-6 text-sm text-slate-500">Consultando estado…</p> : enabled ? (
        <form onSubmit={disable} className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800 sm:col-span-2"><Check aria-hidden="true" className="size-4" /> Segundo factor activo</p>
          <label className="text-sm font-medium text-slate-700">Contraseña actual<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" /></label>
          <label className="text-sm font-medium text-slate-700">Código del autenticador<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" maxLength={8} required value={code} onChange={(event) => setCode(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-mono focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" /></label>
          <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60 sm:col-span-2">{busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ShieldOff aria-hidden="true" className="size-4" />}Desactivar con contraseña y código</button>
        </form>
      ) : setup ? (
        <div className="mt-6 border-t border-slate-200 pt-5"><p className="text-sm font-semibold text-slate-900">Escanea el QR con Microsoft Authenticator</p><p className="mt-1 text-sm text-slate-600">La configuración vence en 10 minutos y solo se activa al validar un código.</p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row"><img src={setup.qrCodeDataUrl} alt="QR para configurar Microsoft Authenticator" width="220" height="220" className="size-[220px] rounded-lg border border-slate-200 bg-white p-2" /><div className="min-w-0 flex-1"><label htmlFor="community-mfa-secret" className="text-sm font-medium text-slate-700">Clave manual</label><div className="mt-1 flex gap-2"><input id="community-mfa-secret" readOnly value={setup.secret} className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 font-mono text-sm" /><button type="button" onClick={() => void copySecret()} aria-label="Copiar clave de configuración" title="Copiar clave" className="grid size-11 shrink-0 place-items-center rounded-lg border border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}</button></div>
            <form onSubmit={enable} className="mt-5 space-y-3"><label htmlFor="community-mfa-confirm" className="block text-sm font-medium text-slate-700">Código de seis dígitos para confirmar<input id="community-mfa-confirm" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" maxLength={8} required value={code} onChange={(event) => setCode(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-mono focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" /></label><button type="submit" disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">{busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <KeyRound aria-hidden="true" className="size-4" />}Confirmar y activar</button></form>
          </div></div>
        </div>
      ) : (
        <form onSubmit={startSetup} className="mt-6 border-t border-slate-200 pt-5"><p className="text-sm text-slate-600">Autoriza la activación con tu contraseña actual. Después escanea el QR o captura la clave manual en Microsoft Authenticator.</p><label htmlFor="community-mfa-password" className="mt-4 block max-w-sm text-sm font-medium text-slate-700">Contraseña actual<input id="community-mfa-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" /></label><button type="submit" disabled={busy} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">{busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ShieldCheck aria-hidden="true" className="size-4" />}Configurar autenticación de dos pasos</button></form>
      )}
    </section>
  );
}