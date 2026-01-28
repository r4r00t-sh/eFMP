import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class HealthController {
    private prisma;
    private redis;
    constructor(prisma: PrismaService, redis: RedisService);
    check(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        checks: Record<string, {
            status: string;
            latency?: number;
            error?: string;
        }>;
    }>;
    liveness(): {
        status: string;
        timestamp: string;
    };
    readiness(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
