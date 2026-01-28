import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SecurityService } from './security.service';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  constructor(private securityService: SecurityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Sanitize query parameters
    if (request.query) {
      Object.keys(request.query).forEach((key) => {
        if (typeof request.query[key] === 'string') {
          request.query[key] = this.securityService.sanitizeInput(request.query[key]);
        }
      });
    }

    // Sanitize body parameters
    if (request.body && typeof request.body === 'object') {
      this.sanitizeObject(request.body);
    }

    return next.handle().pipe(
      map((data) => {
        // Sanitize response data if needed
        if (data && typeof data === 'object') {
          return this.sanitizeResponse(data);
        }
        return data;
      }),
    );
  }

  private sanitizeObject(obj: any): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = this.securityService.sanitizeInput(obj[key]);
        } else if (typeof obj[key] === 'object') {
          this.sanitizeObject(obj[key]);
        }
      }
    }
  }

  private sanitizeResponse(data: any): any {
    // Only sanitize string fields in response, avoid modifying complex objects
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
}

