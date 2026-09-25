'use client';

import React from 'react';
import { MetricsData } from '../../../types';
import { ExecutiveHero } from './ExecutiveHero';
import { ExecutiveMetricsGrid } from './ExecutiveMetricsGrid';
import { ExecutivePipelineFunnel } from './ExecutivePipelineFunnel';

interface DashboardViewProps {
  metrics: MetricsData | null;
  onViewPipeline: () => void;
}

export function DashboardView({ metrics, onViewPipeline }: DashboardViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <ExecutiveHero />
      <ExecutiveMetricsGrid metrics={metrics} />
      <ExecutivePipelineFunnel metrics={metrics} onViewPipeline={onViewPipeline} />
    </div>
  );
}
