import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SecurityService } from './security.service';
export declare class SanitizeInterceptor implements NestInterceptor {
    private securityService;
    constructor(securityService: SecurityService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private sanitizeObject;
    private sanitizeResponse;
}
