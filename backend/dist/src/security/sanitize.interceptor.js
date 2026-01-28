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
exports.SanitizeInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const security_service_1 = require("./security.service");
let SanitizeInterceptor = class SanitizeInterceptor {
    securityService;
    constructor(securityService) {
        this.securityService = securityService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.query) {
            Object.keys(request.query).forEach((key) => {
                if (typeof request.query[key] === 'string') {
                    request.query[key] = this.securityService.sanitizeInput(request.query[key]);
                }
            });
        }
        if (request.body && typeof request.body === 'object') {
            this.sanitizeObject(request.body);
        }
        return next.handle().pipe((0, operators_1.map)((data) => {
            if (data && typeof data === 'object') {
                return this.sanitizeResponse(data);
            }
            return data;
        }));
    }
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return;
        }
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    obj[key] = this.securityService.sanitizeInput(obj[key]);
                }
                else if (typeof obj[key] === 'object') {
                    this.sanitizeObject(obj[key]);
                }
            }
        }
    }
    sanitizeResponse(data) {
        if (typeof data === 'string') {
            return this.securityService.sanitizeInput(data);
        }
        if (Array.isArray(data)) {
            return data.map((item) => this.sanitizeResponse(item));
        }
        if (data && typeof data === 'object') {
            const sanitized = { ...data };
            for (const key in sanitized) {
                if (typeof sanitized[key] === 'string') {
                    sanitized[key] = this.securityService.sanitizeInput(sanitized[key]);
                }
            }
            return sanitized;
        }
        return data;
    }
};
exports.SanitizeInterceptor = SanitizeInterceptor;
exports.SanitizeInterceptor = SanitizeInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_service_1.SecurityService])
], SanitizeInterceptor);
//# sourceMappingURL=sanitize.interceptor.js.map