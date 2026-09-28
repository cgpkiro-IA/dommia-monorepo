'use client';

import { useState, useMemo } from 'react';
import { Building2, Layers, Cpu, Shield } from 'lucide-react';
import { TierInfo } from '../../../types';

import { trackEvent } from '../../../lib/analytics';

interface UseCalculatorProps {
  initialHouses?: number;
  onSelectTier?: (tierName: string, houses: number, estimatedPrice: string) => void;
}

export function useCalculator({ initialHouses = 85, onSelectTier }: UseCalculatorProps = {}) {
  const [houses, setHouses] = useState<number>(initialHouses);

  const tierInfo: TierInfo = useMemo(() => {
    if (houses <= 50) {
      return {
        key: 'BASIC',
        name: 'Dommia Básico',
        badge: 'Cotos y Privadas Pequeñas',
        priceMonthly: 1490,
        pricePerHouse: Math.round(1490 / Math.max(houses, 1)),
        isCustom: false,
        summary: 'La solución ágil para organizar cobranza, directorio y comunicación comunitaria sin complicaciones.',
        features: [
          'Directorio centralizado de residentes y propiedades',
          'Gestión de cuotas ordinarias y estados de cuenta',
          'Dommia Resident (PWA para colonos)',
          'Dominio estándar compartido (standar.dommia.com/{slug})',
          'Add-on subdominio propio ({slug}.dommia.com) disponible (+ $490 MXN/mes)',
          'Registro manual y bitácora de visitas en caseta',
          'Aislamiento estricto de base de datos PostgreSQL',
          'Soporte digital por ticket y base de conocimientos',
        ],
        icon: Building2,
        color: 'border-slate-700 bg-slate-900/60',
        accentBadge: 'bg-slate-800 text-slate-300',
      };
    } else if (houses <= 150) {
      return {
        key: 'STANDARD',
        name: 'Dommia Estándar',
        badge: 'Fraccionamientos Medianos • Más Popular',
        priceMonthly: 2990,
        pricePerHouse: Math.round(2990 / houses),
        isCustom: false,
        summary: 'Control integral de visitantes con códigos QR dinámicos y conciliación automática de pagos.',
        features: [
          'Todo lo incluido en el paquete Básico',
          'Dommia Access con QR Dinámico TOTP (código cambia cada 30s)',
          'Dominio estándar compartido (standar.dommia.com/{slug})',
          'Add-on subdominio propio ({slug}.dommia.com) disponible (+ $490 MXN/mes)',
          'Notificaciones push inmediatas al colono por visita entrante',
          'Conciliación bancaria por referencia y comprobantes',
          'Dommia Guard (interfaz optimizada para caseta)',
          'Soporte prioritario en horario hábil',
        ],
        icon: Layers,
        color: 'border-blue-500/60 bg-blue-950/30',
        accentBadge: 'bg-blue-600/30 text-blue-300 border border-blue-500/40',
      };
    } else if (houses <= 300) {
      return {
        key: 'PROFESSIONAL',
        name: 'Dommia Profesional',
        badge: 'Comunidades Consolidadas',
        priceMonthly: 4990,
        pricePerHouse: Math.round(4990 / houses),
        isCustom: false,
        summary: 'Automatización total vehicular por RFID UHF y cobranza automatizada fintech con Stripe.',
        features: [
          'Todo lo incluido en el paquete Estándar',
          'Antenas RFID UHF vehiculares con apertura en < 0.3 segundos',
          'Pasarela Fintech integrada: Cobro con tarjeta (Stripe) y SPEI',
          'Dominio estándar compartido (standar.dommia.com/{slug})',
          'Add-on subdominio propio ({slug}.dommia.com) disponible (+ $490 MXN/mes)',
          'Bloqueo automático de pluma a residentes morosos configurable',
          'Dommia IoT: Gateway en caseta con sincronización local',
          'Soporte técnico telefónico y WhatsApp prioritario',
        ],
        icon: Cpu,
        color: 'border-indigo-500/60 bg-indigo-950/30',
        accentBadge: 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40',
      };
    } else {
      return {
        key: 'ENTERPRISE',
        name: 'Dommia Master / Enterprise',
        badge: 'Macro-Desarrollos y Clústeres (300+ Casas)',
        priceMonthly: 0,
        pricePerHouse: 0,
        isCustom: true,
        summary: 'Arquitectura distribuida para múltiples casetas, carriles de alta velocidad y SLA del 99.9%.',
        features: [
          'Todo lo incluido en el paquete Profesional',
          '⭐ Subdominio propio ({slug}.dommia.com) o dominio personalizado INCLUIDO 100% GRATIS',
          'Múltiples casetas y carriles de acceso sincronizados en tiempo real',
          'Tolerancia total a fallos: Base de datos local SQLite en cada caseta',
          'Módulo multi-cuenta bancaria y facturación CFDI masiva',
          'Tableros personalizados en Dommia Analytics',
          'SLA 99.9% garantizado por contrato con ejecutivo asignado 24/7',
        ],
        icon: Shield,
        color: 'border-purple-500/60 bg-purple-950/30',
        accentBadge: 'bg-purple-600/30 text-purple-300 border border-purple-500/40',
      };
    }
  }, [houses]);

  const handleApplyTier = () => {
    const priceStr = tierInfo.isCustom
      ? 'A la medida'
      : `$${tierInfo.priceMonthly.toLocaleString('es-MX')} MXN/mes`;

    trackEvent('select_tier', {
      tier_name: tierInfo.name,
      houses_count: houses,
      estimated_price: priceStr,
    });

    if (onSelectTier) {
      onSelectTier(tierInfo.name, houses, priceStr);
    }

    const contactElem = document.getElementById('contacto');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return {
    houses,
    setHouses,
    tierInfo,
    handleApplyTier,
  };
}
