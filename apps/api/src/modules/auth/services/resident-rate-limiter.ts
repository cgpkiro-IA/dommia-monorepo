import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

export interface ResidentRateLimiterBackend {
  assertAllowed(action: string, identifier: string, limit: number, windowMs: number): void;
}

@Injectable()
export class InMemoryResidentRateLimiter implements ResidentRateLimiterBackend {
  private readonly entries = new Map<string, { count: number; resetAt: number }>();

  assertAllowed(action: string, identifier: string, limit: number, windowMs: number) {
    const key = `${action}:${identifier.trim().toLowerCase()}`;
    const now = Date.now();
    const current = this.entries.get(key);

    if (!current || current.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (current.count >= limit) {
      throw new HttpException('Demasiados intentos. Intenta nuevamente más tarde.', HttpStatus.TOO_MANY_REQUESTS);
    }

    current.count += 1;
  }
}
