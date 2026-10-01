'use client';

import React from 'react';
import { Logo } from '@dommia/ui';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { CRM_URL } from '@/lib/app-urls';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-[#050811] border-t border-slate-200 dark:border-slate-800/80 pt-16 pb-12 text-slate-600 dark:text-slate-400 text-sm relative overflow-hidden transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-200 dark:border-slate-800/80">
          {/* Brand info (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" variant="auto" showText={true} />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              <strong className="text-slate-900 dark:text-slate-200">DOMMIA</strong> es la plataforma tecnológica integral diseñada para operar fraccionamientos y condominios modernos mediante la unificación de administración, finanzas, caseta, control de accesos e infraestructura inteligente.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Sistemas y Gateways Operando al 99.9% Uptime</span>
            </div>
          </div>

          {/* Column 1: Ecosistema */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 font-heading">
              Ecosistema Dommia
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#ecosistema" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dommia Communities
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dommia Access (QR Dinámico)
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dommia Finance (Próximamente)
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dommia Resident (PWA)
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dommia Guard (Caseta)
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Dommia IoT Gateway & RFID (Próximamente)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Arquitectura y Seguridad */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 font-heading">
              Arquitectura Segura
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="text-slate-600 dark:text-slate-400">PostgreSQL Multi-Tenant</li>
              <li className="text-slate-600 dark:text-slate-400">Tolerancia Offline con SQLite</li>
              <li className="text-slate-600 dark:text-slate-400">Tokens Criptográficos TOTP</li>
              <li className="text-slate-600 dark:text-slate-400">Broker IoT MQTT Cifrado</li>
              <li className="text-slate-600 dark:text-slate-400">Auditoría Transaccional</li>
            </ul>
          </div>

          {/* Column 3: Acceso y Plataforma */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 font-heading">
              Acceso Rápido
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href={CRM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold"
                >
                  <span>Portal Dommia CRM</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a href="#cotizador" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Cotizador por Viviendas
                </a>
              </li>
              <li>
                <a href="#contacto" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Solicitar Demostración
                </a>
              </li>
              <li className="pt-2">
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Soporte y Mesa de Ayuda:</span>
                <span className="text-slate-800 dark:text-slate-300 font-medium">contacto@dommia.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} DOMMIA Technologies. Todos los derechos reservados.
          </p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>El Sistema Operativo de tu Comunidad</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
