'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { crmApiFetch } from '../api';

interface MfaSetupData {
  secret: string;
  qrCodeDataUrl: string;
  expiresIn: number;
}

export function MfaSettingsPanel() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<MfaSetupData | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await crmApiFetch('/auth/mfa/status');
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo consultar la seguridad de la cuenta.');
      setEnabled(Boolean(result.data.enabled));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'No se pudo consultar la seguridad de la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadStatus(); }, []);

  const startSetup = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await crmApiFetch('/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo iniciar la configuración.');
      setSetup(result.data as MfaSetupData);
      setPassword('');
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : 'No se pudo iniciar la configuración.');
    } finally {
      setBusy(false);
    }
  };

  const enable = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await crmApiFetch('/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.replace(/\s/g, '') }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo activar el segundo factor.');
      setEnabled(true);
      setSetup(null);
      setCode('');
      setNotice('Autenticación en dos pasos activada. Se solicitará en tu próximo inicio de sesión.');
    } catch (enableError) {
      setError(enableError instanceof Error ? enableError.message : 'No se pudo activar el segundo factor.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await crmApiFetch('/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code: code.replace(/\s/g, '') }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo desactivar el segundo factor.');
      setEnabled(false);
      setPassword('');
      setCode('');
      setNotice('Autenticación en dos pasos desactivada.');
    } catch (disableError) {
      setError(disableError instanceof Error ? disableError.message : 'No se pudo desactivar el segundo factor.');
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!setup) return;
    await navigator.clipboard.writeText(setup.secret);
    setCopied(true);
  };

  return (
    <section className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="mfa-heading">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><ShieldCheck aria-hidden="true" /></span>
        <div>
          <h1 id="mfa-heading" className="text-lg font-bold text-slate-900">Autenticación de dos pasos</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">Agrega un código de Microsoft Authenticator después de tu contraseña. La opción es voluntaria y se aplica a tu cuenta.</p>
        </div>
      </div>

      {notice && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading ? <p className="mt-6 text-sm text-slate-500">Consultando estado…</p> : enabled ? (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><Check aria-hidden="true" className="size-4" /> Segundo factor activo</p>
          <form onSubmit={disable} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Contraseña actual
              <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
            </label>
            <label className="text-sm font-medium text-slate-700">Código del autenticador
              <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" maxLength={8} required value={code} onChange={(event) => setCode(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-mono focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
            </label>
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60 sm:col-span-2">
              {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ShieldOff aria-hidden="true" className="size-4" />}
              Desactivar con contraseña y código
            </button>
          </form>
        </div>
      ) : setup ? (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-sm font-semibold text-slate-900">Escanea el QR con Microsoft Authenticator</p>
          <p className="mt-1 text-sm text-slate-600">La configuración vence en 10 minutos y solo se activa después de verificar un código.</p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
            <img src={setup.qrCodeDataUrl} alt="Código QR de configuración para Microsoft Authenticator" width="220" height="220" className="size-[220px] rounded-lg border border-slate-200 bg-white p-2" />
            <div className="min-w-0 flex-1">
              <label htmlFor="mfa-secret" className="text-sm font-medium text-slate-700">Clave manual</label>
              <div className="mt-1 flex gap-2">
                <input id="mfa-secret" readOnly value={setup.secret} className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 font-mono text-sm" />
                <button type="button" onClick={() => void copySecret()} aria-label="Copiar clave de configuración" title="Copiar clave" className="grid size-11 shrink-0 place-items-center rounded-lg border border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                </button>
              </div>
              <form onSubmit={enable} className="mt-5 space-y-3">
                <label htmlFor="mfa-confirm-code" className="block text-sm font-medium text-slate-700">Código de seis dígitos para confirmar
                  <input id="mfa-confirm-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" maxLength={8} required value={code} onChange={(event) => setCode(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-mono focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
                </label>
                <button type="submit" disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">
                  {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <KeyRound aria-hidden="true" className="size-4" />}
                  Confirmar y activar
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={startSetup} className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-sm text-slate-600">Para autorizar la configuración, confirma tu contraseña actual. Después escanea el QR o captura la clave manual en Microsoft Authenticator.</p>
          <label htmlFor="mfa-start-password" className="mt-4 block max-w-sm text-sm font-medium text-slate-700">Contraseña actual
            <input id="mfa-start-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" />
          </label>
          <button type="submit" disabled={busy} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">
            {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ShieldCheck aria-hidden="true" className="size-4" />}
            Configurar autenticación de dos pasos
          </button>
        </form>
      )}
    </section>
  );
}