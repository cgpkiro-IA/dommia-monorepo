'use client';

import { FormEvent } from 'react';
import { RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { useGuardUsers } from '../hooks/useGuardUsers';

interface GuardUsersPanelProps {
  tenantSlug: string;
  authToken: string;
}

export function GuardUsersPanel({ tenantSlug, authToken }: GuardUsersPanelProps) {
  const guards = useGuardUsers(tenantSlug, authToken);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void guards.createGuard();
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]" aria-labelledby="guards-title">
      <div className="space-y-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Dommia Guard</p>
            <h2 id="guards-title" className="mt-1 text-xl font-bold text-slate-900">Cuentas de vigilancia</h2>
            <p className="mt-1 text-sm text-slate-600">Accesos limitados a la validación QR de {tenantSlug}.</p>
          </div>
          <button type="button" onClick={() => void guards.loadGuards()} disabled={guards.loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" aria-label="Actualizar cuentas de guardia">
            <RefreshCw className={`h-4 w-4 ${guards.loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </header>

        {guards.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{guards.error}</p>}
        {guards.success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{guards.success}</p>}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
            <span>Guardia</span><span>Estado</span>
          </div>
          {guards.loading ? (
            <p className="p-5 text-sm text-slate-500">Cargando cuentas...</p>
          ) : guards.guards.length === 0 ? (
            <div className="p-6 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-800">Todavía no hay cuentas de guardia</p>
              <p className="mt-1 text-xs text-slate-500">Crea una cuenta para habilitar el acceso a Dommia Guard.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {guards.guards.map((guard) => (
                <li key={guard.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{guard.first_name} {guard.last_name}</p>
                    <p className="truncate text-xs text-slate-500">{guard.email}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Activo</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="h-fit rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-700" />
          <h3 className="text-base font-bold text-slate-900">Crear cuenta de guardia</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Nombre
            <input required maxLength={100} value={guards.form.firstName} onChange={(event) => guards.updateForm('firstName', event.target.value)} autoComplete="given-name" className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-700">Apellidos
            <input required maxLength={100} value={guards.form.lastName} onChange={(event) => guards.updateForm('lastName', event.target.value)} autoComplete="family-name" className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold text-slate-700">Correo electrónico
          <input required type="email" value={guards.form.email} onChange={(event) => guards.updateForm('email', event.target.value)} autoComplete="email" className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
        </label>
        <label className="mt-3 block text-xs font-semibold text-slate-700">Contraseña inicial
          <input required type="password" value={guards.form.password} onChange={(event) => guards.updateForm('password', event.target.value)} autoComplete="new-password" className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
        </label>
        <p className="mt-2 text-xs leading-5 text-slate-500">Mínimo 10 caracteres con mayúscula, minúscula, número y símbolo.</p>
        <button type="submit" disabled={guards.saving} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">
          <UserPlus className="h-4 w-4" />{guards.saving ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </section>
  );
}