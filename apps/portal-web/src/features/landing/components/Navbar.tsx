'use client';
import React, { useState, useEffect } from 'react';
import { Logo } from '@dommia/ui';
import { ShieldCheck, ChevronRight, Menu, X, ArrowUpRight } from 'lucide-react';
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
          ? 'bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
            <Logo size="md" variant="light" showText={true} />
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#ecosistema" className="hover:text-blue-400 transition-colors">
              Ecosistema
            </a>
            <a href="#filosofia" className="hover:text-blue-400 transition-colors">
              Lo que Somos
            </a>
            <a href="#cotizador" className="hover:text-blue-400 transition-colors">
              Cotizador de Tiers
            </a>
            <a href="#beneficios" className="hover:text-blue-400 transition-colors">
              Seguridad IoT
            </a>
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href={CRM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all border border-slate-700/60"
            >
              <span>Acceso a Clientes</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
            </a>

            <a
              href="#contacto"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all hover:shadow-blue-500/50 hover:scale-[1.02]"
            >
              <span>Solicitar Demostración</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 bg-[#0F172A] border border-slate-800 rounded-xl space-y-3 shadow-xl">
            <a
              href="#ecosistema"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-200 hover:text-blue-400 text-sm font-medium"
            >
              Ecosistema
            </a>
            <a
              href="#filosofia"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-200 hover:text-blue-400 text-sm font-medium"
            >
              Lo que Somos
            </a>
            <a
              href="#cotizador"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-200 hover:text-blue-400 text-sm font-medium"
            >
              Cotizador de Tiers
            </a>
            <a
              href="#contacto"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-200 hover:text-blue-400 text-sm font-medium"
            >
              Contacto
            </a>
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <a
                href={CRM_URL}
                className="block text-center w-full py-2.5 text-xs font-semibold text-slate-300 border border-slate-700 rounded-lg uppercase tracking-wider"
              >
                Acceso a Clientes
              </a>
              <a
                href="#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg"
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
