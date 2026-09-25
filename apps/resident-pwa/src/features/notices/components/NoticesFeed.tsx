'use client';

import React from 'react';
import { Bell, AlertCircle, Wrench, Users, Info } from 'lucide-react';
import { CommunityNotice } from '../../../types';

interface NoticesFeedProps {
  notices: CommunityNotice[];
}

export const NoticesFeed: React.FC<NoticesFeedProps> = ({ notices }) => {
  const getCategoryBadge = (category: CommunityNotice['category']) => {
    switch (category) {
      case 'URGENT':
        return {
          icon: AlertCircle,
          label: 'Urgente',
          style: 'bg-red-950 text-red-300 border-red-800',
        };
      case 'MAINTENANCE':
        return {
          icon: Wrench,
          label: 'Mantenimiento',
          style: 'bg-amber-950 text-amber-300 border-amber-800',
        };
      case 'ASSEMBLY':
        return {
          icon: Users,
          label: 'Asamblea',
          style: 'bg-blue-950 text-blue-300 border-blue-800',
        };
      default:
        return {
          icon: Info,
          label: 'General',
          style: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  return (
    <div className="mx-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 font-heading">
          Avisos y Circulares de la Comunidad
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">
          {notices.length} comunicado(s)
        </span>
      </div>

      <div className="space-y-3">
        {notices.map((notice) => {
          const badge = getCategoryBadge(notice.category);
          const IconComp = badge.icon;

          return (
            <div
              key={notice.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all text-white"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badge.style}`}>
                  <IconComp className="w-3 h-3" />
                  <span>{badge.label}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(notice.publishedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <h4 className="font-bold text-sm text-white mb-1 leading-snug">
                {notice.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {notice.content}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                <span>Emitido por: {notice.author}</span>
                <span className="text-blue-400 font-medium">Disponible sin internet</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
