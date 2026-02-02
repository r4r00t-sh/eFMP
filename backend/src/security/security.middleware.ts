import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private rateLimiter: ReturnType<typeof rateLimit>;

  constructor(private configService: ConfigService) {
    // Create in-memory rate limiter (can be enhanced with Redis store if needed)
    this.rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.configService.get<number>('RATE_LIMIT_MAX', 100),
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req: Request) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply rate limiting
    this.rateLimiter(req, res, (err) => {
      if (err) {
        return res.status(429).json({
          statusCode: 429,
          message: 'Too many requests, please try again later.',
          error: 'Too Many Requests',
        });
      }
      next();
    });
  }
}
