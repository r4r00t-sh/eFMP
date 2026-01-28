import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  async check() {
    const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

    // Check database
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'healthy', latency: Date.now() - start };
    } catch (error: any) {
      checks.database = { status: 'unhealthy', error: error.message };
    }

    // Check Redis
    try {
      const start = Date.now();
      await this.redis.getClient().ping();
      checks.redis = { status: 'healthy', latency: Date.now() - start };
    } catch (error: any) {
      checks.redis = { status: 'unhealthy', error: error.message };
    }

    const allHealthy = Object.values(checks).every(c => c.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    };
  }

  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'not ready', timestamp: new Date().toISOString() };
    }
  }
}

