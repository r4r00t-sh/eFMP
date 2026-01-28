import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { SecurityService } from './security.service';

@Injectable()
export class FileUploadGuard implements CanActivate {
  constructor(private securityService: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const files = request.files || (request.file ? [request.file] : []);

    if (files && files.length > 0) {
      for (const file of files) {
        const validation = this.securityService.validateFileUpload(file);
        if (!validation.valid) {
          throw new BadRequestException(validation.error);
        }
      }
    }

    return true;
  }
}

