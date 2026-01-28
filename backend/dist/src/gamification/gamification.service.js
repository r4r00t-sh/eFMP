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
exports.GamificationService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const rabbitmq_service_1 = require("../rabbitmq/rabbitmq.service");
let GamificationService = class GamificationService {
    prisma;
    rabbitmq;
    DEFAULT_BASE_POINTS = 1000;
    DEFAULT_REDLIST_PENALTY = 50;
    DEFAULT_MONTHLY_BONUS = 100;
    DEFAULT_REDLIST_WARNING_THRESHOLD = 3;
    DEFAULT_REDLIST_SEVERE_THRESHOLD = 5;
    constructor(prisma, rabbitmq) {
        this.prisma = prisma;
        this.rabbitmq = rabbitmq;
    }
    async initializeUserPoints(userId) {
        const basePoints = await this.getSetting('base_points', this.DEFAULT_BASE_POINTS);
        await this.prisma.userPoints.upsert({
            where: { userId },
            create: {
                userId,
                basePoints,
                currentPoints: basePoints,
            },
            update: {},
        });
    }
    async deductForRedList(userId, fileId, fileNumber) {
        const penalty = await this.getSetting('redlist_penalty', this.DEFAULT_REDLIST_PENALTY);
        const userPoints = await this.prisma.userPoints.update({
            where: { userId },
            data: {
                currentPoints: { decrement: penalty },
                redListDeductions: { increment: penalty },
                redListCount: { increment: 1 },
            },
        });
        await this.prisma.pointsTransaction.create({
            data: {
                userId,
                amount: -penalty,
                reason: 'redlist_penalty',
                fileId,
                description: `Red list penalty for file ${fileNumber}`,
            },
        });
        const warningThreshold = await this.getSetting('redlist_warning_threshold', this.DEFAULT_REDLIST_WARNING_THRESHOLD);
        const severeThreshold = await this.getSetting('redlist_severe_threshold', this.DEFAULT_REDLIST_SEVERE_THRESHOLD);
        if (userPoints.redListCount >= severeThreshold) {
            await this.notifyAdminsAboutUser(userId, 'severe_redlist', userPoints.redListCount);
        }
        else if (userPoints.redListCount >= warningThreshold) {
            await this.notifyAdminsAboutUser(userId, 'warning_redlist', userPoints.redListCount);
        }
    }
    async processMonthlyBonuses() {
        console.log('Processing monthly bonuses...');
        const monthlyBonus = await this.getSetting('monthly_bonus', this.DEFAULT_MONTHLY_BONUS);
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const allUserPoints = await this.prisma.userPoints.findMany({
            include: { user: { select: { id: true, name: true, departmentId: true } } },
        });
        for (const userPoints of allUserPoints) {
            const redlistCount = await this.prisma.file.count({
                where: {
                    assignedToId: userPoints.userId,
                    isRedListed: true,
                    redListedAt: {
                        gte: lastMonth,
                        lt: now,
                    },
                },
            });
            if (redlistCount === 0) {
                await this.prisma.userPoints.update({
                    where: { userId: userPoints.userId },
                    data: {
                        currentPoints: { increment: monthlyBonus },
                        monthlyBonus: { increment: monthlyBonus },
                        streakMonths: { increment: 1 },
                        lastMonthReset: now,
                    },
                });
                await this.prisma.pointsTransaction.create({
                    data: {
                        userId: userPoints.userId,
                        amount: monthlyBonus,
                        reason: 'monthly_bonus',
                        description: `Monthly bonus - no red list files`,
                    },
                });
            }
            else {
                await this.prisma.userPoints.update({
                    where: { userId: userPoints.userId },
                    data: {
                        streakMonths: 0,
                        lastMonthReset: now,
                    },
                });
            }
            await this.prisma.userPoints.update({
                where: { userId: userPoints.userId },
                data: { redListCount: 0 },
            });
        }
        console.log('Monthly bonuses processed');
    }
    async getUserPoints(userId) {
        let userPoints = await this.prisma.userPoints.findUnique({
            where: { userId },
        });
        if (!userPoints) {
            await this.initializeUserPoints(userId);
            userPoints = await this.prisma.userPoints.findUnique({
                where: { userId },
            });
        }
        return userPoints;
    }
    async getPointsHistory(userId, limit = 50) {
        return this.prisma.pointsTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async manualAdjustPoints(userId, amount, reason, adminId) {
        await this.prisma.userPoints.update({
            where: { userId },
            data: {
                currentPoints: { increment: amount },
            },
        });
        await this.prisma.pointsTransaction.create({
            data: {
                userId,
                amount,
                reason: 'manual_adjustment',
                description: reason,
                createdById: adminId,
            },
        });
    }
    async getSetting(key, defaultValue) {
        const setting = await this.prisma.systemSettings.findUnique({
            where: { key },
        });
        return setting ? parseInt(setting.value) : defaultValue;
    }
    async notifyAdminsAboutUser(userId, type, count) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, departmentId: true },
        });
        if (!user)
            return;
        const admins = await this.prisma.user.findMany({
            where: {
                OR: [
                    { role: 'SUPER_ADMIN' },
                    { role: 'DEPT_ADMIN', departmentId: user.departmentId },
                ],
                isActive: true,
            },
            select: { id: true },
        });
        const title = type === 'severe_redlist'
            ? 'User Performance Alert - Severe'
            : 'User Performance Alert';
        const message = type === 'severe_redlist'
            ? `${user.name} has ${count} red listed files this month - immediate attention required`
            : `${user.name} has ${count} red listed files this month`;
        const toastType = type === 'severe_redlist'
            ? 'admin_user_severe_redlist'
            : 'admin_user_warning_redlist';
        for (const admin of admins) {
            await this.rabbitmq.publishToast({
                userId: admin.id,
                type: toastType,
                title,
                message,
            });
        }
    }
    async checkAndAwardStreak(userId) {
        const userPoints = await this.getUserPoints(userId);
        if (userPoints) {
            console.log(`User ${userId} streak: ${userPoints.streakMonths} months`);
        }
    }
};
exports.GamificationService = GamificationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GamificationService.prototype, "processMonthlyBonuses", null);
exports.GamificationService = GamificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rabbitmq_service_1.RabbitMQService])
], GamificationService);
//# sourceMappingURL=gamification.service.js.map