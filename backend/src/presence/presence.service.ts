import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PresenceStatus } from '@prisma/client';

@Injectable()
export class PresenceService {
  private readonly HEARTBEAT_TIMEOUT = 3 * 60 * 1000; // 3 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async updateHeartbeat(userId: string): Promise<void> {
    if (!userId) return;
    
    // Verify user exists before updating presence
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    
    if (!userExists) {
      // User doesn't exist, skip presence update
      return;
    }

    const now = new Date();
    const key = `presence:${userId}`;
    
    // Update Redis with current timestamp
    await this.redis.set(key, now.toISOString(), 180); // 3 minutes TTL
    
    // Update database
    try {
      await this.prisma.presence.upsert({
        where: { userId },
        create: {
          userId,
          status: PresenceStatus.ACTIVE,
          lastPing: now,
        },
        update: {
          status: PresenceStatus.ACTIVE,
          lastPing: now,
        },
      });
    } catch (error) {
      // Silently ignore errors (user might have been deleted)
      console.warn(`Failed to update presence for user ${userId}:`, error.message);
    }
  }

  async getPresenceStatus(userId: string): Promise<PresenceStatus> {
    const key = `presence:${userId}`;
    const lastPingStr = await this.redis.get(key);
    
    if (!lastPingStr) {
      // Check database
      const presence = await this.prisma.presence.findUnique({
        where: { userId },
      });
      
      if (!presence) {
        return PresenceStatus.ABSENT;
      }
      
      const timeSinceLastPing = Date.now() - presence.lastPing.getTime();
      if (timeSinceLastPing > this.HEARTBEAT_TIMEOUT) {
        return PresenceStatus.SESSION_TIMEOUT;
      }
      
      return presence.status;
    }
    
    const lastPing = new Date(lastPingStr);
    const timeSinceLastPing = Date.now() - lastPing.getTime();
    
    if (timeSinceLastPing > this.HEARTBEAT_TIMEOUT) {
      // Update status to timeout
      await this.prisma.presence.update({
        where: { userId },
        data: { status: PresenceStatus.SESSION_TIMEOUT },
      });
      return PresenceStatus.SESSION_TIMEOUT;
    }
    
    return PresenceStatus.ACTIVE;
  }

  async markAbsent(userId: string): Promise<void> {
    if (!userId) return;
    
    const key = `presence:${userId}`;
    await this.redis.del(key);
    
    try {
      await this.prisma.presence.update({
        where: { userId },
        data: { status: PresenceStatus.ABSENT },
      });
    } catch (error) {
      // Silently ignore if presence record doesn't exist
    }
  }

  async getActiveUsers(departmentId?: string): Promise<string[]> {
    const where: any = {
      status: PresenceStatus.ACTIVE,
      lastPing: {
        gte: new Date(Date.now() - this.HEARTBEAT_TIMEOUT),
      },
    };
    
    if (departmentId) {
      where.user = { departmentId };
    }
    
    const presences = await this.prisma.presence.findMany({
      where,
      select: { userId: true },
    });
    
    return presences.map(p => p.userId);
  }
}

