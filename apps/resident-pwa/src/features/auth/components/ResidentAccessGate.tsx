'use client';

import React, { useState } from 'react';
import { CheckCircle2, LockKeyhole, ShieldCheck, XCircle } from 'lucide-react';

interface Props {
  mode?: 'login' | 'activate' | 'recovery' | 'reset';
  activationToken?: string;
  onLogin: (identifier: string, password: string, tenantSlug: string) => Promise<void>;
  onActivate: (token: string, password: string) => Promise<void>;
  onChangePassword: (identifier: string, tenantSlug: string, currentPassword: string, newPassword: string) => Promise<void>;
  onPasswordChanged?: () => void;
  onRequestRecovery?: (identifier: string, tenantSlug: string) => Promise<void>;
  onResetPassword?: (token: string, newPassword: string) => Promise<void>;
  onOpenRecovery?: () => void;
  resetToken?: string;
  initialIdentifier?: string;
  initialTenant?: string;
  lockedTenant?: boolean;
  forceChange?: { identifier: string; tenantSlug: string };
}

export function ResidentAccessGate({
  mode = 'login', activationToken, onLogin, onActivate, onChangePassword,
  onPasswordChanged, onRequestRecovery, onResetPassword, onOpenRecovery, resetToken,
  initialIdentifier = '', initialTenant = 'demo', lockedTenant = false, forceChange,
}: Props) {
  const [identifier, setIdentifier] = useState(forceChange?.identifier || initialIdentifier);
  const [tenantSlug, setTenantSlug] = useState(forceChange?.tenantSlug || initialTenant);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const requiresNewPassword = mode === 'activate' || mode === 'reset' || Boolean(forceChange);
  const passwordRules = [
    { label: 'Al menos 10 caracteres', valid: password.length >= 10 },
    { label: 'Una letra mayúscula', valid: /[A-Z]/.test(password) },
    { label: 'Una letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'Un número', valid: /\d/.test(password) },
    { label: 'Un símbolo', valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const isPasswordSecure = passwordRules.every((rule) => rule.valid);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (mode !== 'activate' && !identifier.trim()) {
      setError('Escribe tu correo electrónico o número celular.');
      return;
    }
    if (requiresNewPassword && password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (requiresNewPassword && !isPasswordSecure) {
      setError('La contraseña debe cumplir todas las recomendaciones de seguridad.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'recovery') {
        await onRequestRecovery?.(identifier, tenantSlug);
        setMessage('Si los datos son válidos, recibirás instrucciones para recuperar el acceso.');
      } else if (mode === 'reset') {
        await onResetPassword?.(resetToken || '', password);
        setMessage('Contraseña restablecida. Ya puedes iniciar sesión.');
        onPasswordChanged?.();
      } else if (mode === 'activate') {
        await onActivate(activationToken || '', password);
        setMessage('Cuenta activada. Ya puedes iniciar sesión.');
      } else if (forceChange) {
        await onChangePassword(identifier, tenantSlug, currentPassword, password);
        onPasswordChanged?.();
      } else {
        await onLogin(identifier, password, tenantSlug);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar la operación.');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'activate' ? 'Activa tu acceso Resident' : mode === 'recovery' ? 'Recupera tu acceso' : mode === 'reset' ? 'Define una nueva contraseña' : forceChange ? 'Actualiza tu contraseña' : 'Entra a tu comunidad';
  const description = mode === 'activate' ? 'Crea una contraseña personal para comenzar.' : mode === 'recovery' ? 'Escribe tu correo o celular y te enviaremos instrucciones.' : mode === 'reset' ? 'Crea una contraseña segura para continuar.' : forceChange ? 'Tu contraseña temporal debe cambiarse antes de continuar.' : 'Consulta tus cuotas, invitaciones y avisos desde un solo lugar.';
  return (
    <main className="min-h-screen bg-[#08111f] px-5 py-10 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300"><ShieldCheck className="h-6 w-6" /></div>
          <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">DOMMIA RESIDENT</p><p className="text-xs text-slate-400">El acceso seguro de tu comunidad</p></div>
        </div>
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
          <div className="mb-7"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300"><LockKeyhole className="h-6 w-6" /></div><h1 className="font-heading text-2xl font-black">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>
          <form onSubmit={submit} className="space-y-4">
            {(mode === 'login' || mode === 'recovery') && <>
              <label className="block text-xs font-bold text-slate-300">Correo electrónico o celular<input required type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="correo@ejemplo.com o 55 1234 5678" className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-blue-400" /></label>
              <label htmlFor="resident-tenant-slug" className="block text-xs font-bold text-slate-300">IDTENANT de tu comunidad<input id="resident-tenant-slug" name="tenantSlug" required readOnly={lockedTenant} value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} aria-describedby="resident-tenant-help" autoComplete="organization" placeholder="Ej. bosques" className={`mt-1.5 w-full rounded-xl border px-3.5 py-3 text-sm outline-none ${lockedTenant ? 'cursor-not-allowed border-emerald-700 bg-emerald-950/40 text-emerald-200' : 'border-slate-700 bg-slate-950 text-white focus:border-blue-400'}`} /></label>
              <p id="resident-tenant-help" className="-mt-2 text-[11px] leading-5 text-slate-400">Es el código corto del fraccionamiento, por ejemplo <span className="font-mono text-slate-300">bosques</span>. No es el UUID interno.</p>
            </>}
            {forceChange && <label className="block text-xs font-bold text-slate-300">Contraseña temporal<input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-blue-400" /></label>}
            {mode !== 'recovery' && <label className="block text-xs font-bold text-slate-300">{requiresNewPassword ? 'Nueva contraseña' : 'Contraseña'}<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-blue-400" /></label>}
            {requiresNewPassword && <div aria-live="polite" className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="mb-2 text-[11px] font-bold text-slate-300">Recomendaciones de seguridad</p><ul className="space-y-1.5">{passwordRules.map((rule) => <li key={rule.label} className={`flex items-center gap-2 text-xs ${rule.valid ? 'text-emerald-300' : 'text-red-300'}`}>{rule.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}<span>{rule.label}</span></li>)}</ul></div>}
            {requiresNewPassword && <label className="block text-xs font-bold text-slate-300">Confirma tu contraseña<input required type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-blue-400" /></label>}
            {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}
            {message && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">{message}</p>}
            <button disabled={loading || (requiresNewPassword && !isPasswordSecure)} className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Procesando...' : mode === 'activate' ? 'Activar cuenta' : mode === 'recovery' ? 'Enviar instrucciones' : mode === 'reset' ? 'Restablecer contraseña' : forceChange ? 'Actualizar contraseña' : 'Iniciar sesión'}</button>
            {mode === 'login' && onOpenRecovery && <button type="button" onClick={onOpenRecovery} className="w-full text-xs font-bold text-blue-300 hover:text-blue-200">Olvidé mi contraseña</button>}
          </form>
        </section>
      </div>
    </main>
  );
}
