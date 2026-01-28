import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Custom rate limit decorator for specific endpoints
 * Usage: @CustomThrottle({ short: { limit: 5, ttl: 60000 } })
 */
export const CustomThrottle = (options: {
  short?: { limit: number; ttl: number };
  medium?: { limit: number; ttl: number };
  long?: { limit: number; ttl: number };
}) => {
  const decorators = [];

  if (options.short) {
    decorators.push(Throttle({ default: { limit: options.short.limit, ttl: options.short.ttl } }));
  }

  return applyDecorators(...decorators);
};

/**
 * Strict rate limit for authentication endpoints
 */
export const StrictThrottle = () =>
  Throttle({
    default: { limit: 5, ttl: 60000 }, // 5 requests per minute
  });

/**
 * Moderate rate limit for general API endpoints
 */
export const ModerateThrottle = () =>
  Throttle({
    default: { limit: 50, ttl: 60000 }, // 50 requests per minute
  });

/**
 * Lenient rate limit for read-only endpoints
 */
export const LenientThrottle = () =>
  Throttle({
    default: { limit: 200, ttl: 60000 }, // 200 requests per minute
  });

