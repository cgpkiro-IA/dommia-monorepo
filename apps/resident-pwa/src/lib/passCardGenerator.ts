import QRCode from 'qrcode';

export interface PassCardOptions {
  visitorName: string;
  communityName: string;
  propertyAddress: string;
  validUntil: string;
  passType: 'SINGLE_USE' | 'TEMPORARY' | 'FREQUENT';
  qrPayload: string;
  hostName?: string;
}

export interface GeneratedPassResult {
  blob: Blob;
  dataUrl: string;
  filename: string;
}

/**
 * Generates a crisp QR code as a PNG Data URL
 */
export async function generateQRDataUrl(text: string, size = 320): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generates a complete, beautiful branded digital visitor pass card as a PNG Blob
 */
export async function generatePassCardImage(options: PassCardOptions): Promise<GeneratedPassResult> {
  const width = 640;
  const height = 960;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0B1120');
  bgGrad.addColorStop(0.5, '#0F172A');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Decorative glowing accent banner
  const glowGrad = ctx.createRadialGradient(width / 2, 80, 20, width / 2, 80, 280);
  glowGrad.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
  glowGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, 300);

  // 3. Card Border
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // 4. Header Badge: DOMMIA ACCESS
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 110, 40, 220, 36, 18);
  ctx.fill();
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#60A5FA';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛡️ DOMMIA ACCESS', width / 2, 63);

  // 5. Community Name
  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(options.communityName.toUpperCase(), width / 2, 105);

  // 6. Title: Pase de Acceso
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PASE DE ACCESO DIGITAL', width / 2, 142);

  // 7. Visitor Name Card Box
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.roundRect(48, 170, width - 96, 95, 16);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('INVITADO AUTORIZADO', width / 2, 198);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(options.visitorName, width / 2, 232);

  // Pass type indicator
  const typeLabel =
    options.passType === 'SINGLE_USE'
      ? '1 SOLO USO'
      : options.passType === 'TEMPORARY'
      ? 'TEMPORAL'
      : 'FRECUENTE';
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`• TIPO: ${typeLabel} •`, width / 2, 252);

  // 8. Generate and render the QR Code
  const qrDataUrl = await generateQRDataUrl(options.qrPayload, 380);
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  // White rounded background for optical QR scan
  const qrBoxSize = 360;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 285;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
  ctx.fill();
  ctx.strokeStyle = '#60A5FA';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw QR Image
  const qrImgSize = 310;
  ctx.drawImage(
    qrImg,
    qrBoxX + (qrBoxSize - qrImgSize) / 2,
    qrBoxY + (qrBoxSize - qrImgSize) / 2,
    qrImgSize,
    qrImgSize,
  );

  // 9. Details Footer Section
  const footerY = 675;

  // Validity
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    `📅 Válido hasta: ${new Date(options.validUntil).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    width / 2,
    footerY,
  );

  // Property address
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`📍 Destino: ${options.propertyAddress}`, width / 2, footerY + 28);

  if (options.hostName) {
    ctx.fillText(`👤 Anfitrión: ${options.hostName}`, width / 2, footerY + 52);
  }

  // 10. Security instructions
  ctx.fillStyle = '#64748B';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Presenta este código frente al lector de caseta para apertura de pluma.', width / 2, height - 70);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🔒 CÓDIGO CRIPTOGRÁFICO VERIFICADO POR DOMMIA', width / 2, height - 45);

  // Convert to Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to create blob from canvas'));
    }, 'image/png');
  });

  const dataUrl = canvas.toDataURL('image/png');
  const safeName = options.visitorName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `DOMMIA_Pase_${safeName}.png`;

  return { blob, dataUrl, filename };
}
