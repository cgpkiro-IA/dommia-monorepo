'use client';

import React from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { useCalculator } from '../hooks/useCalculator';
import { HousesSlider } from './HousesSlider';
import { TierRecommendationCard } from './TierRecommendationCard';

interface CalculatorSectionProps {
  onSelectTier?: (tierName: string, houses: number, estimatedPrice: string) => void;
}

export const CalculatorSection: React.FC<CalculatorSectionProps> = ({ onSelectTier }) => {
  const {
    houses,
    setHouses,
    tierInfo,
    planCatalog,
    minHouses,
    maxHouses,
    hasPlanRangeGap,
    catalogStatus,
    retryPlanCatalog,
    handleApplyTier,
  } = useCalculator({ onSelectTier });

  return (
    <section id="cotizador" data-tier={tierInfo?.key.toLowerCase() || 'loading'} className="calculator-section py-24 bg-slate-100/70 dark:bg-[#0B1120] relative border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="calculator-heading text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Precios Transparentes • Sin Letras Chiquitas</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading mb-4">
            Cotizador Dinámico por Número de Viviendas
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Ajusta el control deslizante según el tamaño de tu fraccionamiento o condominio para conocer la versión recomendada y el costo mensual estimado.
          </p>
        </div>

        {catalogStatus === 'loading' && (
          <div className="calculator-catalog-status" role="status" aria-live="polite">
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Cargando precios y límites vigentes…</span>
          </div>
        )}

        {catalogStatus === 'error' && (
          <div className="calculator-catalog-error" role="alert">
            <p>No pudimos consultar el catálogo de planes. Intenta nuevamente en unos segundos.</p>
            <button type="button" onClick={retryPlanCatalog}>Reintentar</button>
          </div>
        )}

        {catalogStatus === 'ready' && hasPlanRangeGap && (
          <div className="calculator-catalog-error" role="alert">
            Los rangos de viviendas configurados en CRM Maestro no cubren {houses} viviendas. Ajusta los mínimos y máximos para cerrar ese intervalo.
          </div>
        )}

        {catalogStatus === 'ready' && tierInfo && (
          <div className="calculator-layout grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            <HousesSlider
              houses={houses}
              tierInfo={tierInfo}
              planCatalog={planCatalog}
              minHouses={minHouses}
              maxHouses={maxHouses}
              onHousesChange={setHouses}
              onApplyTier={handleApplyTier}
            />
            <TierRecommendationCard key={tierInfo.key} tierInfo={tierInfo} />
          </div>
        )}
      </div>
    </section>
  );
};
