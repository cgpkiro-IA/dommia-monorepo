import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';

const MAX_RECEIPT_BYTES = 3_750_000;
const CONTENT_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
} as const;

type ReceiptContentType = keyof typeof CONTENT_TYPES;

@Injectable()
export class ResidentAppReceiptStorageService {
  async store(contentBase64: string, contentType: ReceiptContentType) {
    if (!this.isBase64(contentBase64)) {
      throw new BadRequestException('El comprobante debe ser Base64 válido.');
    }

    const content = Buffer.from(contentBase64, 'base64');
    if (!content.length || content.length > MAX_RECEIPT_BYTES) {
      throw new BadRequestException('El comprobante excede el tamaño permitido.');
    }
    if (!this.matchesContentType(content, contentType)) {
      throw new BadRequestException('El contenido del comprobante no coincide con su tipo declarado.');
    }

    const receiptId = randomUUID();
    const extension = CONTENT_TYPES[contentType];
    const directory = join(process.cwd(), '.local', 'resident-receipts');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${receiptId}.${extension}`), content, { flag: 'wx' });

    return {
      receiptUrl: `local://resident-receipts/${receiptId}.${extension}`,
      storage: 'LOCAL_DEV',
      contentType,
      sizeBytes: content.length,
    };
  }

  private isBase64(value: string) {
    return value.length > 0
      && value.length % 4 === 0
      && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
  }

  private matchesContentType(content: Buffer, contentType: ReceiptContentType) {
    if (contentType === 'application/pdf') return content.subarray(0, 5).toString() === '%PDF-';
    if (contentType === 'image/jpeg') return content.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    return content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
}
