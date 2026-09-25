'use client';

import React from 'react';
import { Users, Mail, Phone, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { ProspectItem, STAGES } from '../../../types';

interface ProspectCardProps {
  item: ProspectItem;
  colIdx: number;
  onStageChange: (prospectId: string, newStage: string) => void;
  onProvision: (prospect: ProspectItem) => void;
}

export function ProspectCard({
  item,
  colIdx,
  onStageChange,
  onProvision,
}: ProspectCardProps) {
  const currentStage = STAGES[colIdx];

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-sm text-slate-900 font-heading leading-tight">
          {item.community_name}
        </h4>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
          {item.estimated_houses} casas
        </span>
      </div>

      <div className="space-y-1 text-xs text-slate-600">
        <p className="font-medium text-slate-800 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.name}</span>
        </p>
        <p className="flex items-center gap-1.5 text-slate-500">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">{item.email}</span>
        </p>
        {item.phone && (
          <p className="flex items-center gap-1.5 text-slate-500">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{item.phone}</span>
          </p>
        )}
      </div>

      {item.notes && (
        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100 line-clamp-3">
          {item.notes}
        </p>
      )}

      {/* Action Buttons for Stage movement */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
        {/* Move Back */}
        {colIdx > 0 ? (
          <button
            onClick={() => onStageChange(item.id, STAGES[colIdx - 1].key)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={`Mover a ${STAGES[colIdx - 1].label}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div />
        )}

        {/* Convert to Tenant button on WON */}
        {currentStage?.key === 'WON' && (
          <button
            onClick={() => onProvision(item)}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
            title="Aprovisionar esquema y fraccionamiento"
          >
            <Sparkles className="w-3 h-3" />
            <span>Aprovisionar</span>
          </button>
        )}

        {/* Move Forward */}
        {colIdx < STAGES.length - 1 ? (
          <button
            onClick={() => onStageChange(item.id, STAGES[colIdx + 1].key)}
            className="px-2 py-1 rounded-md text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer"
            title={`Avanzar a ${STAGES[colIdx + 1].label}`}
          >
            <span>Avanzar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
