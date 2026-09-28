'use client';

import React, { useState, useEffect } from 'react';
import { VisitorPass, ResidentProfile } from '../../../types';
import { X, Share2, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';

interface SharePassModalProps {
  isOpen: boolean;
  pass: VisitorPass | null;
  profile: ResidentProfile | null;
  onClose: () => void;
}

export const SharePassModal: React.FC<SharePassModalProps> = ({
  isOpen,
  pass,
  profile,
  onClose,
}) => {
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const guestPassUrl = pass && profile
    ? `${typeof window === 'undefined' ? '' : window.location.origin}/guest-pass?tenant=${encodeURIComponent(profile.communitySlug)}&id=${encodeURIComponent(pass.id)}`
    : '';

  useEffect(() => {
    if (isOpen && pass) {
      setFeedback(null);
    }
  }, [isOpen, pass]);

  if (!isOpen || !pass) return null;

  const showFeedback = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleShareLink = async () => {
    if (!guestPassUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Pase de acceso para ${pass.visitorName}`, url: guestPassUrl });
        showFeedback('Enlace compartido.', 'success');
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Pase de acceso para ${pass.visitorName}: ${guestPassUrl}`)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    if (!guestPassUrl) return;
    try {
      await navigator.clipboard.writeText(guestPassUrl);
      showFeedback('Enlace copiado.', 'success');
    } catch {
      showFeedback('No se pudo copiar el enlace.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0F172A] border border-slate-700/80 shadow-2xl p-5 text-white flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-3">
          <h3 className="text-lg font-extrabold text-white">
            Compartir Pase de {pass.visitorName}
          </h3>
          <p className="text-xs text-slate-400">
            El código se renueva al abrir el enlace y vence cada 15 segundos.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 mb-3 animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                : feedback.type === 'info'
                ? 'bg-blue-950/80 border border-blue-500/50 text-blue-300'
                : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="my-5 rounded-xl border border-slate-700 bg-slate-950 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase text-slate-400">Vigencia hasta</p>
          <p className="text-sm text-white">{new Date(pass.validUntil).toLocaleString('es-MX')}</p>
          <a href={guestPassUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 break-all text-xs text-sky-300 underline">
            {guestPassUrl}<ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleShareLink}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir enlace</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={handleCopyLink} className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-200 flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer">
              <Copy className="w-3.5 h-3.5 text-blue-400" /><span>Copiar enlace</span>
            </button>
            <button type="button" onClick={() => window.open(guestPassUrl, '_blank', 'noopener,noreferrer')} className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-200 flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Abrir pase</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
