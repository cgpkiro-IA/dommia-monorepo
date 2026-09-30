import QRCode from 'qrcode';

export interface PassCardDetails {
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

export async function createPassCardImage(details: PassCardDetails): Promise<Blob> {
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
  if (!context) throw new Error('No se pudo preparar el lienzo de la tarjeta QR.');

  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#0D1830');
  background.addColorStop(1, '#050A18');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = '#344158';
  context.lineWidth = 5;
  drawRoundedRect(context, 28, 28, width - 56, height - 56, 28);
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
      else reject(new Error('No se pudo exportar la tarjeta QR en formato PNG.'));
    }, 'image/png');
  });
}
