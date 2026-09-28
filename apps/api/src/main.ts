import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('DommiaAPI');
  const app = await NestFactory.create(AppModule, { rawBody: true });
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
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Dommia Core API running on: http://localhost:${port}/api/v1`);
  logger.log(`🩺 Health check available on: http://localhost:${port}/api/v1/health`);
}

bootstrap();
