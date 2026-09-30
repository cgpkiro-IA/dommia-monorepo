import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const MAX_EVIDENCE_BYTES = 3_750_000;
const CONTENT_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
} as const;

type EvidenceContentType = keyof typeof CONTENT_TYPES;

export interface StoredEvidence {
  objectKey: string;
  sizeBytes: number;
  sha256: string;
}

@Injectable()
export class FinancialEvidenceStorageService {
  private readonly storage: Storage;
  private readonly bucketName?: string;
  private readonly localDirectory = join(process.cwd(), '.local', 'financial-evidence');

  constructor(private readonly config: ConfigService) {
    this.storage = new Storage();
    this.bucketName = config.get<string>('GCS_FINANCE_EVIDENCE_BUCKET');
  }

  async store(tenantSlug: string, contentBase64: string, contentType: EvidenceContentType): Promise<StoredEvidence> {
    const content = this.decodeAndValidate(contentBase64, contentType);
    const extension = CONTENT_TYPES[contentType];
    const objectKey = `tenants/${this.safeSegment(tenantSlug)}/financial-evidence/${randomUUID()}.${extension}`;
    const sha256 = createHash('sha256').update(content).digest('hex');

    if (this.bucketName) {
      await this.storage.bucket(this.bucketName).file(objectKey).save(content, {
        resumable: false,
        contentType,
        metadata: {
          cacheControl: 'private, no-store, max-age=0',
          metadata: { sha256, tenantSlug },
        },
        validation: 'crc32c',
      });
    } else {
      if (this.config.get('NODE_ENV') === 'production') {
        throw new Error('GCS_FINANCE_EVIDENCE_BUCKET es obligatorio en producción.');
      }
      await mkdir(this.localDirectory, { recursive: true });
      await writeFile(join(this.localDirectory, basename(objectKey)), content, { flag: 'wx' });
    }

    return { objectKey, sizeBytes: content.length, sha256 };
  }

  async read(objectKey: string) {
    if (this.bucketName) {
      const file = this.storage.bucket(this.bucketName).file(objectKey);
      const [exists] = await file.exists();
      if (!exists) throw new NotFoundException('La evidencia no está disponible.');
      const [content] = await file.download();
      return content;
    }

    try {
      return await readFile(join(this.localDirectory, basename(objectKey)));
    } catch {
      throw new NotFoundException('La evidencia no está disponible.');
    }
  }

  async remove(objectKey: string) {
    if (this.bucketName) {
      await this.storage.bucket(this.bucketName).file(objectKey).delete({ ignoreNotFound: true });
      return;
    }
    await unlink(join(this.localDirectory, basename(objectKey))).catch(() => undefined);
  }

  private decodeAndValidate(value: string, contentType: EvidenceContentType) {
    if (!value || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
      throw new BadRequestException('La evidencia debe enviarse en Base64 válido.');
    }
    const content = Buffer.from(value, 'base64');
    if (!content.length || content.length > MAX_EVIDENCE_BYTES) {
      throw new BadRequestException('La evidencia excede el tamaño máximo de 3.75 MB.');
    }
    if (!this.matchesContentType(content, contentType)) {
      throw new BadRequestException('El contenido no coincide con el tipo de archivo declarado.');
    }
    return content;
  }

  private matchesContentType(content: Buffer, contentType: EvidenceContentType) {
    if (contentType === 'application/pdf') return content.subarray(0, 5).toString() === '%PDF-';
    if (contentType === 'image/jpeg') return content.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    return content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  private safeSegment(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  }
}
