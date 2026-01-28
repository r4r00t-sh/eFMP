import { CanActivate, ExecutionContext } from '@nestjs/common';
import { SecurityService } from './security.service';
export declare class FileUploadGuard implements CanActivate {
    private securityService;
    constructor(securityService: SecurityService);
    canActivate(context: ExecutionContext): boolean;
}
