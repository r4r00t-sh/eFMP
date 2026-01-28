import { ConfigService } from '@nestjs/config';
export declare class SecurityService {
    private configService;
    constructor(configService: ConfigService);
    getHelmetConfig(): {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: string[];
                styleSrc: string[];
                scriptSrc: string[];
                imgSrc: string[];
                connectSrc: string[];
                fontSrc: string[];
                objectSrc: string[];
                mediaSrc: string[];
                frameSrc: string[];
            };
        };
        crossOriginEmbedderPolicy: boolean;
        crossOriginResourcePolicy: {
            policy: string;
        };
        hsts: {
            maxAge: number;
            includeSubDomains: boolean;
            preload: boolean;
        };
        noSniff: boolean;
        xssFilter: boolean;
        referrerPolicy: {
            policy: string;
        };
    };
    getCorsConfig(): {
        origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => void;
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
        maxAge: number;
    };
    getRateLimitConfig(): {
        windowMs: number;
        max: number;
        message: string;
        standardHeaders: boolean;
        legacyHeaders: boolean;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    sanitizeInput(input: string): string;
    validateFileUpload(file: Express.Multer.File): {
        valid: boolean;
        error?: string;
    };
}
