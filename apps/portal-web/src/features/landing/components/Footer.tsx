'use client';
import React from 'react';
import { Logo } from '@dommia/ui';
import { ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';
import { CRM_URL } from '@/lib/app-urls';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#090D16] border-t border-slate-800/80 pt-16 pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand info (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" variant="light" showText={true} />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              <strong className="text-slate-200">DOMMIA</strong> es la plataforma tecnológica diseñada para operar comunidades residenciales modernas mediante la integración de administración, finanzas, accesos vehiculares e infraestructura inteligente.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistemas y Gateways Operando en Red 99.9% Uptime</span>
            </div>
          </div>

          {/* Column 1: Ecosistema */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 font-heading">
              Ecosistema Dommia
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#ecosistema" className="hover:text-blue-400 transition-colors">
                  Dommia Communities
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="hover:text-blue-400 transition-colors">
                  Dommia Access (RFID & QR)
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="hover:text-blue-400 transition-colors">
                  Dommia Finance (Stripe/SPEI)
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="hover:text-blue-400 transition-colors">
                  Dommia Resident (PWA)
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="hover:text-blue-400 transition-colors">
                  Dommia Guard (Caseta)
                </a>
              </li>
              <li>
                <a href="#ecosistema" className="hover:text-blue-400 transition-colors">
                  Dommia IoT (Gateways)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Arquitectura y Tecnología */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 font-heading">
              Arquitectura Segura
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="text-slate-400">PostgreSQL Multi-Tenant</li>
              <li className="text-slate-400">Tolerancia Offline con SQLite</li>
              <li className="text-slate-400">Tokens Criptográficos TOTP</li>
              <li className="text-slate-400">Broker IoT MQTT Seguro</li>
              <li className="text-slate-400">Auditoría Transaccional</li>
            </ul>
          </div>

          {/* Column 3: Acceso y Plataforma */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 font-heading">
              Plataformas
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href={CRM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                >
                  <span>Portal Dommia CRM</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#cotizador" className="hover:text-blue-400 transition-colors">
                  Cotizador por Viviendas
                </a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-blue-400 transition-colors">
                  Solicitar Demostración
                </a>
              </li>
              <li>
                <span className="text-slate-400">Soporte: soporte@dommia.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} DOMMIA Technologies. Todos los derechos reservados.
          </p>
          <p className="flex items-center gap-1">
            <span>El Sistema Operativo de tu Comunidad</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
