'use client';

import React from 'react';
import { ProspectItem, STAGES } from '../../../types';
import { ProspectCard } from './ProspectCard';

interface PipelineKanbanProps {
  prospects: ProspectItem[];
  onStageChange: (prospectId: string, newStage: string) => void;
  onProvision: (prospect: ProspectItem) => void;
}

export function PipelineKanban({
  prospects,
  onStageChange,
  onProvision,
}: PipelineKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
      {STAGES.map((col, colIdx) => {
        const colProspects = prospects.filter((p) => p.stage === col.key);

        return (
          <div
            key={col.key}
            className={`rounded-2xl border border-slate-200/90 shadow-xs flex flex-col min-h-[480px] bg-slate-50/60 border-t-4 ${col.color}`}
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-slate-200/70 flex items-center justify-between bg-white rounded-t-xl">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider font-heading">
                {col.label}
              </span>
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                {colProspects.length}
              </span>
            </div>

            {/* Column Body Cards */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[650px]">
              {colProspects.map((item) => (
                <ProspectCard
                  key={item.id}
                  item={item}
                  colIdx={colIdx}
                  onStageChange={onStageChange}
                  onProvision={onProvision}
                />
              ))}

              {colProspects.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  Sin prospectos en esta etapa
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
