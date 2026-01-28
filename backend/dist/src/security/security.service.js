"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SecurityService = class SecurityService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    getHelmetConfig() {
        return {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            noSniff: true,
            xssFilter: true,
            referrerPolicy: { policy: 'no-referrer' },
        };
    }
    getCorsConfig() {
        const allowedOrigins = this.configService
            .get('ALLOWED_ORIGINS', 'http://localhost:3000')
            .split(',')
            .map((origin) => origin.trim());
        return {
            origin: (origin, callback) => {
                if (!origin) {
                    return callback(null, true);
                }
                if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Headers',
                'Access-Control-Allow-Methods',
            ],
            exposedHeaders: ['Content-Range', 'X-Content-Range'],
            maxAge: 86400,
        };
    }
    getRateLimitConfig() {
        return {
            windowMs: 15 * 60 * 1000,
            max: this.configService.get('RATE_LIMIT_MAX', 100),
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        };
    }
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }
    validateFileUpload(file) {
        const maxSize = this.configService.get('MAX_FILE_SIZE', 10 * 1024 * 1024);
        const allowedMimeTypes = this.configService
            .get('ALLOWED_FILE_TYPES', 'application/pdf,image/jpeg,image/png,image/jpg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            .split(',')
            .map((type) => type.trim());
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
            };
        }
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return {
                valid: false,
                error: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
            };
        }
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
        const fileExtension = file.originalname
            .toLowerCase()
            .substring(file.originalname.lastIndexOf('.'));
        if (dangerousExtensions.includes(fileExtension)) {
            return {
                valid: false,
                error: `File extension ${fileExtension} is not allowed for security reasons`,
            };
        }
        return { valid: true };
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityService);
//# sourceMappingURL=security.service.js.map