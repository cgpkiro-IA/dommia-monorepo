'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useCalculator } from '../hooks/useCalculator';
import { HousesSlider } from './HousesSlider';
import { TierRecommendationCard } from './TierRecommendationCard';

interface CalculatorSectionProps {
  onSelectTier?: (tierName: string, houses: number, estimatedPrice: string) => void;
}

export const CalculatorSection: React.FC<CalculatorSectionProps> = ({ onSelectTier }) => {
  const { houses, setHouses, tierInfo, handleApplyTier } = useCalculator({ onSelectTier });

  return (
    <section id="cotizador" className="py-24 bg-[#0B1120] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Precios Transparentes • Sin Letras Chiquitas</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-heading mb-4">
            Cotizador Dinámico por Número de Viviendas
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Ajusta el control deslizante según el tamaño de tu fraccionamiento o condominio para conocer la versión recomendada y el costo mensual estimado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          <HousesSlider
            houses={houses}
            tierInfo={tierInfo}
            onHousesChange={setHouses}
            onApplyTier={handleApplyTier}
          />
          <TierRecommendationCard tierInfo={tierInfo} />
        </div>
      </div>
    </section>
  );
};
