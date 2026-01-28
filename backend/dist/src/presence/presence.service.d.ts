import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PresenceStatus } from '@prisma/client';
export declare class PresenceService {
    private prisma;
    private redis;
    private readonly HEARTBEAT_TIMEOUT;
    constructor(prisma: PrismaService, redis: RedisService);
    updateHeartbeat(userId: string): Promise<void>;
    getPresenceStatus(userId: string): Promise<PresenceStatus>;
    markAbsent(userId: string): Promise<void>;
    getActiveUsers(departmentId?: string): Promise<string[]>;
}
