'use client';

import React, { useState } from 'react';
import { SelectedPlan } from '../types';
import { Navbar } from '../features/landing/components/Navbar';
import { Hero } from '../features/landing/components/Hero';
import { ProductEcosystem } from '../features/landing/components/ProductEcosystem';
import { WhatWeAre } from '../features/landing/components/WhatWeAre';
import { CalculatorSection } from '../features/calculator/components/CalculatorSection';
import { AcquisitionSection } from '../features/acquisition/components/AcquisitionSection';
import { Footer } from '../features/landing/components/Footer';

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>({
    tierName: 'Dommia Estándar',
    houses: 85,
    estimatedPrice: '$2,990 MXN/mes',
  });

  const handleTierSelected = (tierName: string, houses: number, estimatedPrice: string) => {
    setSelectedPlan({
      tierName,
      houses,
      estimatedPrice,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* Hero Section with Live Dashboard Mockup */}
        <Hero />

        {/* 8 Product Ecosystem */}
        <ProductEcosystem />

        {/* Brand Positioning: Lo que SOMOS vs Lo que NO somos */}
        <WhatWeAre />

        {/* Dynamic Tier Calculator */}
        <CalculatorSection onSelectTier={handleTierSelected} />

        {/* Lead Capture Form & Self-Service Activation */}
        <AcquisitionSection
          selectedTier={selectedPlan.tierName}
          selectedHouses={selectedPlan.houses}
          estimatedPrice={selectedPlan.estimatedPrice}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
