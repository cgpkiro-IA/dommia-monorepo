'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { VisitorPass, ResidentProfile } from '../../../types';
import { createPassCardImage } from '../../../lib/passCardGenerator';

export function useSharePass(
  isOpen: boolean,
  pass: VisitorPass | null,
  profile: ResidentProfile | null,
) {
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const guestPassUrl = useMemo(() => {
    if (!pass || !profile) return '';
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    return `${origin}/guest-pass?tenant=${encodeURIComponent(profile.communitySlug)}&id=${encodeURIComponent(pass.id)}`;
  }, [pass, profile]);

  const safeVisitorName = useMemo(() => {
    if (!pass) return 'visita';
    return (
      pass.visitorName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-]+/g, '-')
        .replace(/^-|-$/g, '') || 'visita'
    );
  }, [pass]);

  const showFeedback = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const generateCard = useCallback(async (): Promise<Blob | null> => {
    if (!pass || !guestPassUrl) return null;
    setGenerating(true);
    try {
      const passTypeLabel =
        pass.passType === 'SINGLE_USE'
          ? '1 USO'
          : pass.passType === 'TEMPORARY'
            ? 'TEMPORAL'
            : 'FRECUENTE';

      const blob = await createPassCardImage({
        guestPassUrl,
        communityName: profile?.communityName || profile?.communitySlug || 'DOMMIA',
        visitorName: pass.visitorName,
        passType: passTypeLabel,
        validUntil: pass.validUntil,
        propertyAddress: profile?.propertyAddress || 'Dirección no disponible',
        hostName: profile?.name || 'Anfitrión',
      });
      setCardBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      return blob;
    } catch {
      showFeedback('No se pudo generar la imagen del pase.', 'error');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [pass, guestPassUrl, profile, showFeedback]);

  useEffect(() => {
    if (isOpen && pass) {
      setFeedback(null);
      setCopiedImage(false);
      void generateCard();
    } else {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCardBlob(null);
    }
  }, [isOpen, pass, generateCard]);

  const handleDownloadImage = useCallback(async () => {
    const blob = cardBlob || (await generateCard());
    if (!blob) return;
    const downloadLink = document.createElement('a');
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = `pase-${safeVisitorName}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showFeedback('Imagen PNG descargada exitosamente.', 'success');
  }, [cardBlob, generateCard, safeVisitorName, showFeedback]);

  const handleCopyImage = useCallback(async () => {
    const blob = cardBlob || (await generateCard());
    if (!blob) return;
    if (navigator.clipboard?.write && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3000);
        showFeedback('¡Imagen copiada! Puedes pegarla con Ctrl+V en WhatsApp o cualquier chat.', 'success');
        return;
      } catch {
        // Fallback a descarga si portapapeles no tiene permisos
      }
    }
    await handleDownloadImage();
  }, [cardBlob, generateCard, handleDownloadImage, showFeedback]);

  const handleShareImage = useCallback(async () => {
    const blob = cardBlob || (await generateCard());
    if (!blob) return;
    const imageFile = new File([blob], `pase-${safeVisitorName}.png`, { type: 'image/png' });

    // CRÍTICO: No incluir 'title' ni 'text' al compartir archivos de imagen.
    // En WebKit (iOS/macOS), mezclar texto hace que el sistema clasifique el ítem como documento de texto,
    // ocultando WhatsApp y fotos, y mostrando únicamente Notas y Correo.
    if (navigator.share && navigator.canShare?.({ files: [imageFile] })) {
      try {
        await navigator.share({ files: [imageFile] });
        showFeedback('Menú de compartir abierto con la imagen completa.', 'success');
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }

    // Fallback para navegadores de escritorio sin soporte de compartir archivos
    await handleCopyImage();
    await handleDownloadImage();
    showFeedback('Imagen copiada al portapapeles y descargada para enviar por WhatsApp.', 'info');
  }, [cardBlob, generateCard, handleCopyImage, handleDownloadImage, safeVisitorName, showFeedback]);

  const handleShareWhatsApp = useCallback(() => {
    if (!pass) return;
    const message = `*PASE DE ACCESO DOMMIA*\nInvitado: ${pass.visitorName}\nVigencia: ${new Date(pass.validUntil).toLocaleString('es-MX')}\n\nAbre tu código QR de acceso actualizado aquí:\n${guestPassUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }, [pass, guestPassUrl]);

  const handleCopyLink = useCallback(async () => {
    if (!guestPassUrl) return;
    try {
      await navigator.clipboard.writeText(guestPassUrl);
      showFeedback('Enlace copiado al portapapeles.', 'success');
    } catch {
      showFeedback('No se pudo copiar el enlace.', 'error');
    }
  }, [guestPassUrl, showFeedback]);

  return {
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
  };
}
