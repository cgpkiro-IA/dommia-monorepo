'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { Plus } from 'lucide-react';
import { ProspectItem } from '../../../types';
import { PipelineKanban } from './PipelineKanban';

interface PipelineViewProps {
  prospects: ProspectItem[];
  onOpenModal: () => void;
  onStageChange: (prospectId: string, newStage: string) => void;
  onProvision: (prospect: ProspectItem) => void;
}

export function PipelineView({
  prospects,
  onOpenModal,
  onStageChange,
  onProvision,
}: PipelineViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header of Pipeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
            Pipeline Comercial de Prospectos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gestiona las oportunidades comerciales desde la captación en la web hasta la contratación formal y aprovisionamiento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenModal}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nuevo Prospecto Manual
          </Button>
        </div>
      </div>

      <PipelineKanban
        prospects={prospects}
        onStageChange={onStageChange}
        onProvision={onProvision}
      />
    </div>
  );
}
