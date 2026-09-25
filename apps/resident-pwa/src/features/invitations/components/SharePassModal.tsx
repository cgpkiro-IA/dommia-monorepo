'use client';

import React, { useState, useEffect } from 'react';
import { VisitorPass, ResidentProfile } from '../../../types';
import { generatePassCardImage, GeneratedPassResult } from '../../../lib/passCardGenerator';
import { X, Share2, Copy, Download, MessageSquare, Check, Sparkles, AlertCircle } from 'lucide-react';

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
  const [generated, setGenerated] = useState<GeneratedPassResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen && pass) {
      setLoading(true);
      setGenerated(null);
      setFeedback(null);

      generatePassCardImage({
        visitorName: pass.visitorName,
        communityName: profile?.communityName || 'Fraccionamiento Residencial',
        propertyAddress: profile?.propertyAddress || 'Domicilio del Residente',
        validUntil: pass.validUntil,
        passType: pass.passType,
        qrPayload: pass.qrPayload,
        hostName: profile?.name,
      })
        .then((res) => {
          setGenerated(res);
        })
        .catch((err) => {
          console.error('Error generating pass image:', err);
          setFeedback({ message: 'Error al generar la imagen del pase.', type: 'error' });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, pass, profile]);

  if (!isOpen || !pass) return null;

  const showFeedback = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Share via Web Share API with image file attachment
  const handleShareImage = async () => {
    if (!generated) return;

    const file = new File([generated.blob], generated.filename, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Pase de Acceso - ${pass.visitorName}`,
          text: `👋 Hola ${pass.visitorName}, te comparto tu Pase de Acceso QR para ingresar a mi fraccionamiento en DOMMIA. Presenta esta imagen en la caseta.`,
          files: [file],
        });
        showFeedback('¡Pase compartido exitosamente!', 'success');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    }

    // Fallback: Copy to clipboard and open WhatsApp
    await handleCopyImage();
  };

  // 2. Copy image to clipboard for instant Ctrl+V in WhatsApp Web
  const handleCopyImage = async () => {
    if (!generated) return;

    try {
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({ 'image/png': generated.blob });
        await navigator.clipboard.write([item]);
        showFeedback('¡Imagen copiada al portapapeles! Pégala (Ctrl+V) en WhatsApp.', 'success');
        return;
      }
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }

    // Fallback if clipboard image not allowed
    handleDownloadImage();
  };

  // 3. Download image to device
  const handleDownloadImage = () => {
    if (!generated) return;

    const a = document.createElement('a');
    a.href = generated.dataUrl;
    a.download = generated.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showFeedback('Imagen descargada en tu dispositivo.', 'info');
  };

  // 4. Open WhatsApp with text message
  const handleOpenWhatsAppText = () => {
    const text = `👋 Hola ${pass.visitorName}, te comparto tu Pase de Acceso QR para ingresar a ${profile?.communityName || 'mi fraccionamiento'}:\n\n🔑 Código: ${pass.qrPayload.slice(0, 16)}\n📍 Destino: ${profile?.propertyAddress || ''}\n📅 Válido hasta: ${new Date(pass.validUntil).toLocaleDateString()}\n\nPresenta el código en caseta para abrir la pluma.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-slate-700/80 shadow-2xl p-5 text-white flex flex-col max-h-[92vh] overflow-y-auto">
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pase Gráfico Generado</span>
          </div>
          <h3 className="text-lg font-extrabold text-white">
            Compartir Pase de {pass.visitorName}
          </h3>
          <p className="text-xs text-slate-400">
            Imagen digital de alta resolución lista para WhatsApp
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

        {/* Image Preview Container */}
        <div className="relative w-full rounded-2xl bg-[#0B1120] border border-slate-700/60 p-2 flex items-center justify-center min-h-[220px] mb-4 overflow-hidden shadow-inner">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-slate-400 text-xs py-12">
              <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Generando tarjeta gráfica QR...</span>
            </div>
          ) : generated ? (
            <img
              src={generated.dataUrl}
              alt={`Pase QR ${pass.visitorName}`}
              className="w-full max-h-[260px] object-contain rounded-xl shadow-lg"
            />
          ) : (
            <span className="text-xs text-slate-500">No se pudo cargar la vista previa.</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Main Action: Native Share with image */}
          <button
            type="button"
            onClick={handleShareImage}
            disabled={loading || !generated}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir Imagen en WhatsApp</span>
          </button>

          {/* Quick Copy Image Button */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={loading || !generated}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-200 flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Copiar imagen para pegar con Ctrl+V"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>Copiar Imagen</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={loading || !generated}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-200 flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Guardar PNG en tu galería o descargas"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar PNG</span>
            </button>
          </div>

          {/* WhatsApp Text Message Link */}
          <button
            type="button"
            onClick={handleOpenWhatsAppText}
            className="w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-800/80 transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Enviar únicamente texto a WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
