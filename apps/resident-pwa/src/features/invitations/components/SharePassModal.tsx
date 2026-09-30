'use client';

import React from 'react';
import { VisitorPass, ResidentProfile } from '../../../types';
import { useSharePass } from '../hooks/useSharePass';
import {
  X,
  Share2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Download,
  Loader2,
  ImageIcon,
  MessageCircle,
} from 'lucide-react';

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
  const {
    feedback,
    previewUrl,
    generating,
    copiedImage,
    guestPassUrl,
    handleDownloadImage,
    handleShareImage,
    handleCopyImage,
    handleShareWhatsApp,
    handleCopyLink,
  } = useSharePass(isOpen, pass, profile);

  if (!isOpen || !pass) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0F172A] border border-slate-700/80 shadow-2xl p-4 sm:p-5 text-white flex flex-col max-h-[94vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-3 pr-6">
          <h3 className="text-base sm:text-lg font-extrabold text-white">
            Pase de {pass.visitorName}
          </h3>
          <p className="text-[11px] text-slate-400">
            {pass.status === 'ACTIVE'
              ? 'Comparte la tarjeta con código QR o el enlace seguro de acceso'
              : 'Detalle e historial del pase de acceso'}
          </p>
        </div>

        {pass.status !== 'ACTIVE' && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2.5 mb-3 border ${
            pass.status === 'USED'
              ? 'bg-blue-950/90 border-blue-500/50 text-blue-200'
              : pass.status === 'EXPIRED'
              ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {pass.status === 'USED'
                  ? 'Pase Ya Utilizado'
                  : pass.status === 'EXPIRED'
                  ? 'Pase Vencido / Expirado'
                  : 'Pase Revocado'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {pass.status === 'USED'
                  ? `Este pase fue validado y registrado en caseta${pass.usedAt ? ` el ${new Date(pass.usedAt).toLocaleString('es-MX')}` : ''}. No permitirá nuevos accesos.`
                  : pass.status === 'EXPIRED'
                  ? `La vigencia concluyó el ${new Date(pass.validUntil).toLocaleString('es-MX')}. Genera un nuevo pase para autorizar esta visita.`
                  : 'Esta autorización fue cancelada por el anfitrión.'}
              </p>
            </div>
          </div>
        )}

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

        {/* Previsualización visual de la tarjeta de pase */}
        <div className="relative mb-3 flex flex-col items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950/80 p-2.5 overflow-hidden">
          {generating ? (
            <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
              <span className="text-xs">Generando tarjeta digital…</span>
            </div>
          ) : previewUrl ? (
            <div className="w-full flex flex-col items-center">
              <img
                src={previewUrl}
                alt={`Tarjeta de pase para ${pass.visitorName}`}
                className="max-h-56 w-auto rounded-lg shadow-lg border border-slate-800 object-contain"
              />
              <span className="mt-1.5 text-[10px] text-slate-400">
                Mantén presionada o haz clic derecho para guardar/copiar
              </span>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No se pudo cargar la vista previa
            </div>
          )}
        </div>

        {/* Botones de acción principales para la imagen completa */}
        <div className="space-y-2">
          {/* 1. Compartir Imagen (WhatsApp / Apps nativas) */}
          <button
            type="button"
            onClick={() => void handleShareImage()}
            disabled={generating}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir Imagen Completa</span>
          </button>

          {/* 2. WhatsApp Directo */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar mensaje por WhatsApp</span>
          </button>

          {/* 3. Acciones rápidas de imagen: Copiar y Descargar */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void handleCopyImage()}
              disabled={generating}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 font-semibold text-xs text-slate-200 flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ImageIcon className="w-3.5 h-3.5 text-sky-400" />}
              <span>{copiedImage ? '¡Copiada!' : 'Copiar Imagen'}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadImage()}
              disabled={generating}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 font-semibold text-xs text-slate-200 flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar PNG</span>
            </button>
          </div>

          {/* 4. Enlace directo */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-semibold text-[11px] text-slate-300 flex items-center justify-center gap-1.5 border border-slate-800 transition-all cursor-pointer"
            >
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copiar Enlace</span>
            </button>
            <button
              type="button"
              onClick={() => window.open(guestPassUrl, '_blank', 'noopener,noreferrer')}
              className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-semibold text-[11px] text-slate-300 flex items-center justify-center gap-1.5 border border-slate-800 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3 h-3 text-slate-400" />
              <span>Abrir Enlace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
