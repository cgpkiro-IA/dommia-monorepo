import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

function getCorsOrigins(config: ConfigService) {
  const configuredOrigins = config.get<string>('CORS_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (config.get('NODE_ENV') === 'production') {
    if (!configuredOrigins?.length || configuredOrigins.includes('*')) {
      throw new Error('CORS_ORIGINS debe definir una allowlist explícita en producción.');
    }
    for (const origin of configuredOrigins) {
      let parsedOrigin: URL;
      try {
        parsedOrigin = new URL(origin);
      } catch {
        throw new Error(`Origen inválido en CORS_ORIGINS: ${origin}.`);
      }
      if (parsedOrigin.protocol !== 'https:' || parsedOrigin.origin !== origin) {
        throw new Error(`CORS_ORIGINS solo admite orígenes HTTPS sin ruta: ${origin}.`);
      }
    }
    return configuredOrigins;
  }

  return configuredOrigins?.length
    ? configuredOrigins
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'];
}

async function bootstrap() {
  const logger = new Logger('DommiaAPI');
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const corsOrigins = getCorsOrigins(app.get(ConfigService));
  app.use(helmet());
  app.use(json({ limit: '6mb' }));

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: (origin, callback) => callback(null, Boolean(origin && corsOrigins.includes(origin))),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = Number.parseInt(process.env.PORT || process.env.API_PORT || '4000', 10);
  await app.listen(port);
  logger.log(`🚀 Dommia Core API running on: http://localhost:${port}/api/v1`);
  logger.log(`🩺 Health check available on: http://localhost:${port}/api/v1/health`);
}

bootstrap();
