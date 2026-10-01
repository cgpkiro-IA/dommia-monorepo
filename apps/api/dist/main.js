"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const express_1 = require("express");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
function getCorsOrigins(config) {
    const configuredOrigins = config.get('CORS_ORIGINS')
        ?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    if (config.get('NODE_ENV') === 'production') {
        if (!configuredOrigins?.length || configuredOrigins.includes('*')) {
            throw new Error('CORS_ORIGINS debe definir una allowlist explícita en producción.');
        }
        for (const origin of configuredOrigins) {
            let parsedOrigin;
            try {
                parsedOrigin = new URL(origin);
            }
            catch {
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
    const logger = new common_1.Logger('DommiaAPI');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    const corsOrigins = getCorsOrigins(app.get(config_1.ConfigService));
    app.use((0, helmet_1.default)());
    app.use((0, express_1.json)({ limit: '6mb' }));
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
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
//# sourceMappingURL=main.js.map