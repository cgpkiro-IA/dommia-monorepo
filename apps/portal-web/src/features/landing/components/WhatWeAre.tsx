'use client';
import React from 'react';
import { XCircle, CheckCircle2, Shield, HeartHandshake, Zap, Scale, Sparkles } from 'lucide-react';

export const WhatWeAre: React.FC = () => {
  return (
    <section id="filosofia" className="py-24 bg-[#0B1120] relative border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nuestra Filosofía y Posicionamiento</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-heading mb-4">
            No somos un parche. Somos el Sistema Operativo.
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            La mayoría de las comunidades residenciales utilizan herramientas aisladas que no se hablan entre sí. En DOMMIA construimos una plataforma única y coherente.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
          {/* Lo que NO somos */}
          <div className="p-8 rounded-2xl bg-red-950/10 border border-red-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  El Modelo Tradicional Fragmentado
                </span>
                <h3 className="text-2xl font-black text-white font-heading">
                  Lo que NO somos
                </h3>
              </div>
            </div>

            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-300 text-sm">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No somos solo un sistema de plumas:</strong> Que deja de abrir cuando se va el internet o falla el lector RFID.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-300 text-sm">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No somos un software aislado de acceso:</strong> Desconectado de si el colono va al corriente o tiene adeudos de mantenimiento.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-300 text-sm">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No somos solo una app de residentes:</strong> Que nadie descarga porque ocupa espacio innecesario en la memoria de su teléfono.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-300 text-sm">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No somos un sistema contable burocrático:</strong> Con interfaces lentas de los años 2000 que requieren semanas de capacitación.
                </span>
              </li>
            </ul>
          </div>

          {/* Lo que SOMOS */}
          <div className="p-8 rounded-2xl bg-blue-950/20 border border-blue-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  La Nueva Forma de Vivir y Operar
                </span>
                <h3 className="text-2xl font-black text-white font-heading">
                  Lo que SOMOS
                </h3>
              </div>
            </div>

            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-200 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>La plataforma operativa unificada:</strong> Que sincroniza en tiempo real caseta, cuentas bancarias, colonos y directiva.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-200 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Arquitectura Offline-First real:</strong> Respaldada por SQLite en cada caseta para garantizar acceso continuo sin retrasos.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-200 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Cobranza automatizada fintech:</strong> Tarjeta de crédito/débito vía Stripe y referencias directas SPEI con conciliación inmediata.
                </span>
              </li>
              <li className="flex items-start gap-3 text-slate-200 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Seguridad criptográfica TOTP:</strong> Códigos QR dinámicos que expiran en 30 segundos, impidiendo capturas de pantalla reutilizadas.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 5 Core Pillars from Brand Manual */}
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            Nuestros 5 Principios Inquebrantables
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <Shield className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Confianza</h4>
              <p className="text-xs text-slate-400">Datos protegidos con aislamiento PostgreSQL</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <Scale className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Transparencia</h4>
              <p className="text-xs text-slate-400">Cuentas y cobros claros para todo colono</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Innovación</h4>
              <p className="text-xs text-slate-400">Tecnología que resuelve fricciones reales</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <HeartHandshake className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Comunidad</h4>
              <p className="text-xs text-slate-400">Fortaleciendo la convivencia y armonía</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center sm:col-span-2 lg:col-span-1">
              <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Escalabilidad</h4>
              <p className="text-xs text-slate-400">Crece de 20 a más de 1,000 residencias</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
