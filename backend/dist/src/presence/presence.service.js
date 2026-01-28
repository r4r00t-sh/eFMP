"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
const client_1 = require("@prisma/client");
let PresenceService = class PresenceService {
    prisma;
    redis;
    HEARTBEAT_TIMEOUT = 3 * 60 * 1000;
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async updateHeartbeat(userId) {
        if (!userId)
            return;
        const userExists = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!userExists) {
            return;
        }
        const now = new Date();
        const key = `presence:${userId}`;
        await this.redis.set(key, now.toISOString(), 180);
        try {
            await this.prisma.presence.upsert({
                where: { userId },
                create: {
                    userId,
                    status: client_1.PresenceStatus.ACTIVE,
                    lastPing: now,
                },
                update: {
                    status: client_1.PresenceStatus.ACTIVE,
                    lastPing: now,
                },
            });
        }
        catch (error) {
            console.warn(`Failed to update presence for user ${userId}:`, error.message);
        }
    }
    async getPresenceStatus(userId) {
        const key = `presence:${userId}`;
        const lastPingStr = await this.redis.get(key);
        if (!lastPingStr) {
            const presence = await this.prisma.presence.findUnique({
                where: { userId },
            });
            if (!presence) {
                return client_1.PresenceStatus.ABSENT;
            }
            const timeSinceLastPing = Date.now() - presence.lastPing.getTime();
            if (timeSinceLastPing > this.HEARTBEAT_TIMEOUT) {
                return client_1.PresenceStatus.SESSION_TIMEOUT;
            }
            return presence.status;
        }
        const lastPing = new Date(lastPingStr);
        const timeSinceLastPing = Date.now() - lastPing.getTime();
        if (timeSinceLastPing > this.HEARTBEAT_TIMEOUT) {
            await this.prisma.presence.update({
                where: { userId },
                data: { status: client_1.PresenceStatus.SESSION_TIMEOUT },
            });
            return client_1.PresenceStatus.SESSION_TIMEOUT;
        }
        return client_1.PresenceStatus.ACTIVE;
    }
    async markAbsent(userId) {
        if (!userId)
            return;
        const key = `presence:${userId}`;
        await this.redis.del(key);
        try {
            await this.prisma.presence.update({
                where: { userId },
                data: { status: client_1.PresenceStatus.ABSENT },
            });
        }
        catch (error) {
        }
    }
    async getActiveUsers(departmentId) {
        const where = {
            status: client_1.PresenceStatus.ACTIVE,
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
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], PresenceService);
//# sourceMappingURL=presence.service.js.map