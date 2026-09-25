"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('DommiaAPI');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
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
//# sourceMappingURL=main.js.map