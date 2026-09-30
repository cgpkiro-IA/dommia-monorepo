'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Building2, KeyRound, Loader2, LockKeyhole, Mail } from 'lucide-react';

interface CrmLoginProps {
  onSubmit: (email: string, password: string) => void;
  loading: boolean;
  error: string | null;
}

export function CrmLogin({ onSubmit, loading, error }: CrmLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(email.trim(), password);
  };

  return (
    <main className="min-h-screen bg-[#0F172A] px-4 py-12 text-white flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-blue-600"><Building2 aria-hidden="true" /></span>
          <div><p className="text-lg font-bold">DOMMIA</p><p className="text-xs text-slate-400">CRM Maestro SaaS</p></div>
        </div>
        <h1 className="text-xl font-bold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-400">Acceso exclusivo para el equipo Dommia.</p>
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium" htmlFor="crm-email">Correo electrónico</label>
          <div className="relative -mt-2">
            <Mail aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-slate-400" />
            <input id="crm-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400" />
          </div>
          <label className="block text-sm font-medium" htmlFor="crm-password">Contraseña</label>
          <div className="relative -mt-2">
            <LockKeyhole aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-slate-400" />
            <input id="crm-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400" />
          </div>
          <button type="submit" disabled={loading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:opacity-60">
            {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="size-4" />}
            {loading ? 'Validando…' : 'Continuar'}
          </button>
        </form>
      </section>
    </main>
  );
}

interface CrmMfaChallengeProps {
  onSubmit: (code: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

export function CrmMfaChallenge({ onSubmit, onCancel, loading, error }: CrmMfaChallengeProps) {
  const [code, setCode] = useState('');
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(code.replace(/\s/g, ''));
  };

  return (
    <main className="min-h-screen bg-[#0F172A] px-4 py-12 text-white flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">
        <KeyRound aria-hidden="true" className="mb-5 size-8 text-blue-400" />
        <h1 className="text-xl font-bold">Verificación en dos pasos</h1>
        <p className="mt-2 text-sm text-slate-400">Ingresa el código de seis dígitos de Microsoft Authenticator.</p>
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label htmlFor="crm-mfa-code" className="block text-sm font-medium">Código de autenticación</label>
          <input id="crm-mfa-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" maxLength={8} required value={code} onChange={(event) => setCode(event.target.value)} className="min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-center font-mono text-xl tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400" />
          <button type="submit" disabled={loading} className="min-h-11 w-full rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:opacity-60">
            {loading ? 'Verificando…' : 'Verificar e ingresar'}
          </button>
          <button type="button" onClick={onCancel} className="min-h-10 w-full rounded-lg px-4 text-sm font-medium text-slate-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">Volver al inicio de sesión</button>
        </form>
      </section>
    </main>
  );
}