'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { VisitorPass, ResidentProfile } from '../../../types';
import { X, Share2, Copy, Check, AlertCircle, ExternalLink, QrCode, Loader2 } from 'lucide-react';

interface SharePassModalProps {
  isOpen: boolean;
  pass: VisitorPass | null;
  profile: ResidentProfile | null;
  onClose: () => void;
}

interface PassCardDetails {
  guestPassUrl: string;
  communityName: string;
  visitorName: string;
  passType: string;
  validUntil: string;
  propertyAddress: string;
  hostName: string;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawFittedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  color: string,
  fontWeight = '600',
) {
  let fittedFontSize = fontSize;
  context.textAlign = 'center';
  context.fillStyle = color;
  context.font = `${fontWeight} ${fittedFontSize}px Arial, sans-serif`;
  while (context.measureText(text).width > maxWidth && fittedFontSize > 20) {
    fittedFontSize -= 2;
    context.font = `${fontWeight} ${fittedFontSize}px Arial, sans-serif`;
  }
  context.fillText(text, x, y, maxWidth);
}

async function createPassCardImage(details: PassCardDetails) {
  const qrDataUrl = await QRCode.toDataURL(details.guestPassUrl, {
    width: 650,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#0B1120', light: '#FFFFFF' },
  });
  const qrImage = new Image();
  qrImage.src = qrDataUrl;
  await qrImage.decode();

  const width = 1200;
  const height = 1800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo preparar la tarjeta QR.');

  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#0D1830');
  background.addColorStop(1, '#050A18');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = '#344158';
  context.lineWidth = 5;
  drawRoundedRect(context, 28, 28, width - 56, height - 56, 2);
  context.stroke();

  drawRoundedRect(context, 390, 72, 420, 72, 36);
  context.fillStyle = '#142342';
  context.fill();
  context.strokeStyle = '#2563EB';
  context.lineWidth = 3;
  context.stroke();
  drawFittedText(context, '◆ DOMMIA ACCESS', width / 2, 119, 370, 29, '#93C5FD', '700');

  drawFittedText(context, `FRACC. ${details.communityName.toLocaleUpperCase('es-MX')}`, width / 2, 205, 1000, 28, '#A8B7CC', '600');
  drawFittedText(context, 'PASE DE ACCESO DIGITAL', width / 2, 275, 1040, 49, '#F8FAFC', '800');

  drawRoundedRect(context, 88, 320, 1024, 180, 28);
  context.fillStyle = '#1E293B';
  context.fill();
  context.strokeStyle = '#334155';
  context.lineWidth = 3;
  context.stroke();
  drawFittedText(context, 'INVITADO AUTORIZADO', width / 2, 366, 940, 22, '#A8B7CC', '700');
  drawFittedText(context, details.visitorName, width / 2, 431, 940, 46, '#38BDF8', '700');
  drawFittedText(context, `• TIPO: ${details.passType} •`, width / 2, 472, 940, 20, '#34D399', '700');

  drawRoundedRect(context, 260, 540, 680, 680, 52);
  context.fillStyle = '#FFFFFF';
  context.fill();
  context.strokeStyle = '#60A5FA';
  context.lineWidth = 6;
  context.stroke();
  context.drawImage(qrImage, 315, 595, 570, 570);

  drawFittedText(context, `Válido hasta: ${new Date(details.validUntil).toLocaleString('es-MX')}`, width / 2, 1285, 1040, 25, '#E2E8F0', '700');
  drawFittedText(context, `Destino: ${details.propertyAddress}`, width / 2, 1340, 1040, 23, '#A8B7CC', '600');
  drawFittedText(context, `Anfitrión: ${details.hostName}`, width / 2, 1390, 1040, 23, '#A8B7CC', '600');

  drawFittedText(context, 'Escanea este QR para abrir el pase digital actualizado.', width / 2, 1645, 1040, 20, '#8090A8', '500');
  drawFittedText(context, 'El código de acceso requiere conexión y se renueva cada 15 segundos.', width / 2, 1687, 1040, 18, '#34D399', '600');

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo exportar la tarjeta QR.'));
    }, 'image/png');
  });
}

export const SharePassModal: React.FC<SharePassModalProps> = ({
  isOpen,
  pass,
  profile,
  onClose,
}) => {
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [sharingQr, setSharingQr] = useState(false);
  const guestPassUrl = pass && profile
    ? `${typeof window === 'undefined' ? '' : window.location.origin}/guest-pass?tenant=${encodeURIComponent(profile.communitySlug)}&id=${encodeURIComponent(pass.id)}`
    : '';

  useEffect(() => {
    if (isOpen && pass) {
      setFeedback(null);
      setSharingQr(false);
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

  const handleShareQr = async () => {
    if (!guestPassUrl || sharingQr) return;
    setSharingQr(true);
    try {
      const passTypeLabel = pass.passType === 'SINGLE_USE'
        ? '1 USO'
        : pass.passType === 'TEMPORARY'
          ? 'TEMPORAL'
          : 'FRECUENTE';
      const imageBlob = await createPassCardImage({
        guestPassUrl,
        communityName: profile?.communityName || profile?.communitySlug || 'DOMMIA',
        visitorName: pass.visitorName,
        passType: passTypeLabel,
        validUntil: pass.validUntil,
        propertyAddress: profile?.propertyAddress || 'Dirección no disponible',
        hostName: profile?.name || 'Anfitrión',
      });
      const safeVisitorName = pass.visitorName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-]+/g, '-')
        .replace(/^-|-$/g, '') || 'visita';
      const imageFile = new File([imageBlob], `pase-${safeVisitorName}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [imageFile] })) {
        await navigator.share({
          files: [imageFile],
          title: `Pase QR para ${pass.visitorName}`,
          text: `Escanea este QR para abrir el pase actualizado de ${pass.visitorName}. Requiere conexión a internet.`,
        });
        showFeedback('Se abrió el menú de compartir del dispositivo.', 'success');
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: `Pase de acceso para ${pass.visitorName}`,
          text: `Este navegador no permite compartir imágenes. Usa el enlace para abrir el pase actualizado: ${guestPassUrl}`,
          url: guestPassUrl,
        });
        showFeedback('Tu dispositivo compartió el enlace del pase; no admite compartir la imagen QR desde el navegador.', 'info');
        return;
      }

      const downloadLink = document.createElement('a');
      const imageUrl = URL.createObjectURL(imageBlob);
      downloadLink.href = imageUrl;
      downloadLink.download = imageFile.name;
      downloadLink.click();
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
      showFeedback('QR descargado. Adjunta la imagen en WhatsApp, correo u otra aplicación.', 'info');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      showFeedback('No se pudo compartir el QR. Copia o comparte el enlace del pase.', 'error');
    } finally {
      setSharingQr(false);
    }
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
            El QR compartido abre el pase; el código de acceso se renueva cada 15 segundos.
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
            onClick={handleShareQr}
            disabled={sharingQr}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {sharingQr ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <QrCode className="w-4 h-4" aria-hidden="true" />}
            <span>{sharingQr ? 'Preparando QR…' : 'Compartir QR'}</span>
          </button>

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
