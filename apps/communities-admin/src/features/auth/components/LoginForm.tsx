'use client';

import React from 'react';
import { Building2, Mail, Lock, Loader2, ArrowRight, Layers, AlertTriangle, Check } from 'lucide-react';

interface LoginFormProps {
  form: { email: string; password: string };
  onChange: (field: 'email' | 'password', value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  success: boolean;
  onQuickDemo: (email: string, pass: string) => void;
}

export function LoginForm({
  form,
  onChange,
  onSubmit,
  loading,
  error,
  success,
  onQuickDemo,
}: LoginFormProps) {
  return (
    <div className="login-screen min-h-screen bg-[#0F172A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="login-liquid-scene" aria-hidden="true">
        <span className="login-liquid-orb login-liquid-orb--cyan" />
        <span className="login-liquid-orb login-liquid-orb--green" />
        <span className="login-liquid-orb login-liquid-orb--magenta" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="login-brand flex items-center justify-center gap-3 mb-6">
          <div className="login-brand-mark w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-wider font-heading">
              DOMMIA
            </span>
            <span className="block text-[11px] font-semibold text-blue-400 uppercase tracking-widest -mt-1">
              Communities
            </span>
          </div>
        </div>

        <h2 className="login-heading text-center text-2xl font-extrabold text-white font-heading">
          {success ? '¡Bienvenido de nuevo!' : 'Acceso a tu Fraccionamiento'}
        </h2>
        <p className="login-copy mt-2 text-center text-xs text-slate-400 max-w-sm mx-auto">
          {success
            ? 'Acceso confirmado. Estamos preparando tu comunidad.'
            : 'Ingresa con tus credenciales. El sistema detectará automáticamente tu comunidad o te permitirá elegir entre tus fraccionamientos registrados.'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className={`login-glass-panel bg-slate-900/95 border border-slate-800 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl backdrop-blur-xl${success ? ' login-glass-panel--success' : ''}`}>
          {success ? (
            <div className="login-success" role="status" aria-live="polite">
              <div className="login-success-mark">
                <Check className="w-10 h-10" strokeWidth={2.5} />
              </div>
              <h3 className="login-success-title">¡Inicio de sesión exitoso!</h3>
              <p className="login-success-copy">Bienvenido de nuevo. Tu comunidad está lista.</p>
              <div className="login-success-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="login-error mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={onSubmit} className="login-form space-y-5">
                <div className="login-field login-field--email">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail aria-hidden="true" className="login-field-icon absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => onChange('email', e.target.value)}
                      placeholder="admin@tucomunidad.com"
                      className="login-input w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="login-field login-field--password">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock aria-hidden="true" className="login-field-icon absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => onChange('password', e.target.value)}
                      placeholder="••••••••••••"
                      className="login-input w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="login-submit w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando credenciales...</span>
                    </>
                  ) : (
                    <>
                      <span>Ingresar al Portal</span>
                      <ArrowRight className="login-submit-arrow w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="login-demo-list mt-6 pt-5 border-t border-slate-800 space-y-2">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-2">
                  Pruebas de Flujo Rápido:
                </span>

                <button
                  type="button"
                  onClick={() => onQuickDemo('admin@laspalmas.dommia.com.mx', 'LasPalmas2026!')}
                  className="login-demo-option login-demo-option--multi w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-white font-bold block">1. Admin Multi-Fraccionamiento</span>
                    <span className="text-slate-400 text-[10px]">Las Palmas + Valle Real (Abre selector)</span>
                  </div>
                  <Layers className="w-4 h-4 text-blue-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onQuickDemo('admin@arboledas.com', 'Password2026!')}
                  className="login-demo-option login-demo-option--single w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-left text-xs transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-white font-bold block">2. Admin Unipersonal</span>
                    <span className="text-slate-400 text-[10px]">Solo Arboledas del Sur (Entrada directa)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
