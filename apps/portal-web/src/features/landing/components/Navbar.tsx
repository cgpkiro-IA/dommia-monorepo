'use client';

import React, { useState, useEffect } from 'react';
import { Logo, Button, ThemeToggle } from '@dommia/ui';
import { ChevronRight, Menu, X, ArrowUpRight } from 'lucide-react';
import { CRM_URL } from '@/lib/app-urls';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800/90 shadow-lg shadow-slate-900/5 dark:shadow-black/60 py-2.5 sm:py-3'
          : 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 py-3.5 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 lg:gap-6">
          {/* Brand Logo */}
          <a
            href="#"
            className="flex items-center gap-2 group transition-transform hover:scale-[1.02] focus:outline-none shrink-0"
            aria-label="DOMMIA - Inicio"
          >
            <Logo size="md" variant="auto" showText={true} />
          </a>

          {/* Desktop Navigation Links (Concise, no-wrap, balanced spacing) */}
          <div className="hidden xl:flex items-center space-x-1 p-1 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#ecosistema"
              className="px-3.5 py-1.5 rounded-full hover:text-blue-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all whitespace-nowrap"
            >
              Ecosistema
            </a>
            <a
              href="#filosofia"
              className="px-3.5 py-1.5 rounded-full hover:text-blue-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all whitespace-nowrap"
            >
              Lo que Somos
            </a>
            <a
              href="#cotizador"
              className="px-3.5 py-1.5 rounded-full hover:text-blue-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all whitespace-nowrap"
            >
              Cotizador
            </a>
            <a
              href="#contacto"
              className="px-3.5 py-1.5 rounded-full hover:text-blue-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all whitespace-nowrap"
            >
              Contacto & Demo
            </a>
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center space-x-2.5 lg:space-x-3 shrink-0">
            {/* Theme Switcher */}
            <ThemeToggle variant="dropdown" />

            <a
              href={CRM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all border border-slate-200 dark:border-slate-700/60 whitespace-nowrap shrink-0"
            >
              <span>Acceso Admins</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            </a>

            <a href="#contacto" className="shrink-0">
              <Button
                variant="primary"
                size="sm"
                className="shadow-md shadow-blue-600/25 whitespace-nowrap font-bold"
                rightIcon={<ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              >
                Solicitar Demostración
              </Button>
            </a>
          </div>

          {/* Mobile actions & hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle variant="compact" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 focus:outline-none"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-5 bg-white dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tema Visual
              </span>
              <ThemeToggle variant="segmented" />
            </div>
            <a
              href="#ecosistema"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-sm font-semibold"
            >
              Ecosistema Modular (8 Soluciones)
            </a>
            <a
              href="#filosofia"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-sm font-semibold"
            >
              Lo que Somos (Filosofía)
            </a>
            <a
              href="#cotizador"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-sm font-semibold"
            >
              Cotizador de Tiers
            </a>
            <a
              href="#contacto"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-sm font-semibold"
            >
              Contacto & Demo
            </a>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <a
                href={CRM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center w-full py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase tracking-wider"
              >
                Acceso a Administradores
              </a>
              <a
                href="#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-3 text-xs font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30"
              >
                Solicitar Demostración
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
