'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Layers, Cpu, Shield } from 'lucide-react';
import { PublicPlanCatalogItem, TierInfo, TierKey } from '../../../types';
import { API_BASE } from '../../../lib/api-url';
import { STATIC_PLAN_CATALOG } from '../static-plan-catalog';
import { contactMailto } from '../../../lib/contact-email';

import { trackEvent } from '../../../lib/analytics';

interface UseCalculatorProps {
  initialHouses?: number;
  onSelectTier?: (tierName: string, houses: number, estimatedPrice: string) => void;
}

const tierVisuals: Record<TierKey, { icon: TierInfo['icon']; color: string; accentBadge: string }> = {
  BASIC: {
    icon: Building2,
    color: 'border-slate-700 bg-slate-900/60',
    accentBadge: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  },
  STANDARD: {
    icon: Layers,
    color: 'border-blue-500/60 bg-blue-950/30',
    accentBadge: 'bg-blue-50 text-blue-800 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-500/50',
  },
  PROFESSIONAL: {
    icon: Cpu,
    color: 'border-indigo-500/60 bg-indigo-950/30',
    accentBadge: 'bg-indigo-50 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-500/50',
  },
  ENTERPRISE: {
    icon: Shield,
    color: 'border-purple-500/60 bg-purple-950/30',
    accentBadge: 'bg-purple-50 text-purple-800 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-500/50',
  },
};

function getDomainFeatures(plan: PublicPlanCatalogItem) {
  const standardDomain = plan.code === 'ENTERPRISE'
    ? 'standar.dommia.com.mx/tu-fraccionamiento'
    : plan.standardDomainPattern.replace('{slug}', 'tu-fraccionamiento');
  const customDomain = plan.code === 'ENTERPRISE'
    ? plan.standardDomainPattern.replace('{slug}', 'tu-fraccionamiento')
    : 'tu-fraccionamiento.dommia.com.mx';
  const domainAddon = Number(plan.customDomainAddonPrice).toLocaleString('es-MX');

  return [
    `Dominio estándar compartido (${standardDomain})`,
    plan.includesCustomDomain
      ? `Dominio personalizado incluido (${customDomain})`
      : `Subdominio propio disponible como add-on (+ $${domainAddon} MXN/mes)`,
  ];
}

function getTierFeatures(plan: PublicPlanCatalogItem) {
  const domainFeatures = getDomainFeatures(plan);

  switch (plan.code) {
    case 'BASIC':
      return [
        'Directorio centralizado de residentes y propiedades',
        'Gestión de cuotas ordinarias y estados de cuenta',
        'Dommia Resident (PWA para colonos)',
        ...domainFeatures,
        'Registro manual y bitácora de visitas en caseta',
        'Aislamiento estricto de base de datos PostgreSQL',
        'Soporte digital por ticket y base de conocimientos',
      ];
    case 'STANDARD':
      return [
        'Todo lo incluido en el paquete Básico',
        'Dommia Access con QR Dinámico TOTP (código cambia cada 30s)',
        ...domainFeatures,
        'Notificaciones push inmediatas al colono por visita entrante',
        'Conciliación bancaria por referencia y comprobantes',
        'Dommia Guard (interfaz optimizada para caseta)',
        'Soporte prioritario en horario hábil',
      ];
    case 'PROFESSIONAL':
      return [
        'Todo lo incluido en el paquete Estándar',
        'Antenas RFID UHF vehiculares con apertura en < 0.3 segundos (Próximamente)',
        'Pasarela Fintech integrada: Cobro con tarjeta (Stripe) y SPEI (Próximamente)',
        ...domainFeatures,
        'Bloqueo automático de pluma a residentes morosos configurable',
        'Dommia IoT: Gateway en caseta con sincronización local',
        'Soporte técnico telefónico y WhatsApp prioritario',
      ];
    case 'ENTERPRISE':
      return [
        'Todo lo incluido en el paquete Profesional',
        ...domainFeatures,
        'Múltiples casetas y carriles de acceso sincronizados en tiempo real',
        'Tolerancia total a fallos: Base de datos local SQLite en cada caseta',
        'Módulo multi-cuenta bancaria y facturación CFDI masiva',
        'Tableros personalizados en Dommia Analytics',
        'SLA 99.9% garantizado por contrato con ejecutivo asignado 24/7',
      ];
  }
}

function updateCapacityCopy(description: string | null, plan: PublicPlanCatalogItem) {
  if (!description) return 'Plan configurable para comunidades residenciales.';
  if (plan.code === 'ENTERPRISE') {
    const minimum = plan.minProperties;
    return description.replace(/\b\d+\s*\+\s*(casas|viviendas|propiedades)/gi, `${minimum}+ $1`);
  }
  return description.replace(/\bhasta\s+\d+\s+(casas|viviendas|propiedades)/gi, `hasta ${plan.maxProperties} $1`);
}

export function useCalculator({ initialHouses = 85, onSelectTier }: UseCalculatorProps = {}) {
  const staticMode = process.env.NEXT_PUBLIC_PORTAL_STATIC_MODE === '1';
  const [houses, setHouses] = useState<number>(initialHouses);
  const [planCatalog, setPlanCatalog] = useState<PublicPlanCatalogItem[]>(staticMode ? STATIC_PLAN_CATALOG : []);
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>(staticMode ? 'ready' : 'loading');
  const [catalogRetry, setCatalogRetry] = useState(0);

  useEffect(() => {
    if (staticMode) return;
    const controller = new AbortController();
    setCatalogStatus('loading');
    setPlanCatalog([]);

    fetch(`${API_BASE}/crm/public-plans`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`No se pudo cargar el catálogo (HTTP ${response.status}).`);
        const result = await response.json() as { success?: boolean; data?: PublicPlanCatalogItem[] };
        if (!result.success || !Array.isArray(result.data)) throw new Error('El catálogo de planes no tiene un formato válido.');

        const plans = result.data
          .filter((plan) => plan.code in tierVisuals && Number(plan.minProperties) > 0 && Number(plan.maxProperties) >= Number(plan.minProperties))
          .map((plan) => ({
            ...plan,
            monthlyPrice: Number(plan.monthlyPrice),
            minProperties: Number(plan.minProperties),
            maxProperties: Number(plan.maxProperties),
            customDomainAddonPrice: Number(plan.customDomainAddonPrice),
            sortOrder: Number(plan.sortOrder),
          }))
          .sort((first, second) => first.sortOrder - second.sortOrder);

        if (!plans.length) throw new Error('No hay planes activos para cotizar.');
        setPlanCatalog(plans);
        setCatalogStatus('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setCatalogStatus('error');
      });

    return () => controller.abort();
  }, [catalogRetry, staticMode]);

  const tierInfo = useMemo<TierInfo | null>(() => {
    if (!planCatalog.length) return null;

    const selectedIndex = planCatalog.findIndex((plan) => houses >= plan.minProperties && houses <= plan.maxProperties);
    if (selectedIndex === -1) return null;
    const plan = planCatalog[selectedIndex];
    const visual = tierVisuals[plan.code];
    const isCustom = plan.code === 'ENTERPRISE' && !staticMode;
    const badge = plan.code === 'ENTERPRISE'
      ? `${plan.minProperties}–${plan.maxProperties} viviendas`
      : `${plan.minProperties}–${plan.maxProperties} viviendas${plan.isHighlighted ? ' • Más popular' : ''}`;

    return {
      key: plan.code,
      name: plan.name,
      badge,
      priceMonthly: Number(plan.monthlyPrice),
      pricePerHouse: isCustom ? 0 : Math.round(Number(plan.monthlyPrice) / Math.max(houses, 1)),
      isCustom,
      summary: updateCapacityCopy(plan.description, plan),
      features: getTierFeatures(plan),
      icon: visual.icon,
      color: visual.color,
      accentBadge: visual.accentBadge,
    };
  }, [houses, planCatalog, staticMode]);

  const handleApplyTier = () => {
    if (!tierInfo) return;

    const priceStr = tierInfo.isCustom
      ? 'A la medida'
      : `$${tierInfo.priceMonthly.toLocaleString('es-MX')} MXN/mes`;

    if (staticMode) {
      onSelectTier?.(tierInfo.name, houses, priceStr);
      window.location.href = contactMailto('Solicitud de demostración DOMMIA', [
        `Plan de interés: ${tierInfo.name} (${priceStr})`,
        `Viviendas: ${houses}`,
      ]);
      return;
    }

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
    planCatalog,
    minHouses: planCatalog[0]?.minProperties ?? 1,
    maxHouses: planCatalog.length ? Math.max(...planCatalog.map((plan) => plan.maxProperties)) : 450,
    hasPlanRangeGap: catalogStatus === 'ready' && planCatalog.length > 0 && tierInfo === null,
    catalogStatus,
    retryPlanCatalog: () => setCatalogRetry((attempt) => attempt + 1),
    handleApplyTier,
  };
}
