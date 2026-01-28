"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("@nestjs/config");
const security_service_1 = require("./security/security.service");
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const securityService = app.get(security_service_1.SecurityService);
    app.use((0, helmet_1.default)(securityService.getHelmetConfig()));
    const maxRequestSize = configService.get('MAX_REQUEST_SIZE', '10mb');
    app.use((0, express_1.json)({ limit: maxRequestSize }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: maxRequestSize }));
    app.enableCors(securityService.getCorsConfig());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        disableErrorMessages: configService.get('NODE_ENV') === 'production',
        validationError: {
            target: false,
            value: false,
        },
    }));
    app.set('trust proxy', 1);
    const port = configService.get('PORT', 3001);
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
}
bootstrap();
//# sourceMappingURL=main.js.map