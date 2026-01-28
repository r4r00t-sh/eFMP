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
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let PerformanceService = class PerformanceService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async getConfig(key) {
        const config = await this.prisma.performanceConfig.findUnique({
            where: { key },
        });
        return config?.value || null;
    }
    async setConfig(key, value, description) {
        return this.prisma.performanceConfig.upsert({
            where: { key },
            update: { value, description, updatedAt: new Date() },
            create: { key, value, description },
        });
    }
    async getDefaultConfig() {
        const highVolumeThreshold = await this.getConfig('high_volume_threshold');
        const highMomentumThreshold = await this.getConfig('high_momentum_threshold');
        const optimumHours = await this.getConfig('optimum_hours_per_day');
        const coinThreshold = await this.getConfig('coin_threshold_warning');
        const filesPerDayOptimum = await this.getConfig('files_per_day_optimum');
        return {
            highVolumeThreshold: highVolumeThreshold || 10,
            highMomentumThreshold: highMomentumThreshold || 5,
            optimumHours: optimumHours || 8,
            coinThreshold: coinThreshold || 100,
            filesPerDayOptimum: filesPerDayOptimum || 5,
            coinPerOptimumFile: 10,
            coinPerExcessFile: 5,
            redFlagThreshold: 3,
        };
    }
    async awardCoinsForOptimumFile(userId, fileId) {
        const config = await this.getDefaultConfig();
        const coins = config.coinPerOptimumFile;
        const userPoints = await this.prisma.userPoints.findUnique({
            where: { userId },
        });
        const currentBalance = userPoints?.currentPoints || 0;
        const newBalance = currentBalance + coins;
        await this.prisma.userPoints.upsert({
            where: { userId },
            update: {
                currentPoints: newBalance,
            },
            create: {
                userId,
                currentPoints: coins,
                basePoints: coins,
            },
        });
        await this.prisma.coinTransaction.create({
            data: {
                userId,
                fileId,
                amount: coins,
                balanceAfter: newBalance,
                transactionType: 'file_processed_optimum',
                description: `Awarded ${coins} coins for processing file within optimum time`,
            },
        });
        const threshold = Number(config.coinThreshold);
        if (currentBalance >= threshold && newBalance < threshold) {
            await this.sendLowCoinsNotification(userId, newBalance);
        }
        return { coins, newBalance };
    }
    async awardCoinsForExcessFiles(userId, excessCount) {
        const config = await this.getDefaultConfig();
        const coins = excessCount * config.coinPerExcessFile;
        const userPoints = await this.prisma.userPoints.findUnique({
            where: { userId },
        });
        const currentBalance = userPoints?.currentPoints || 0;
        const newBalance = currentBalance + coins;
        await this.prisma.userPoints.upsert({
            where: { userId },
            update: {
                currentPoints: newBalance,
            },
            create: {
                userId,
                currentPoints: coins,
                basePoints: coins,
            },
        });
        await this.prisma.coinTransaction.create({
            data: {
                userId,
                amount: coins,
                balanceAfter: newBalance,
                transactionType: 'excess_files',
                description: `Awarded ${coins} coins for processing ${excessCount} excess files`,
            },
        });
        return { coins, newBalance };
    }
    async deductCoinsForRedFlag(userId, fileId, flagType) {
        const config = await this.getDefaultConfig();
        const deduction = 20;
        const userPoints = await this.prisma.userPoints.findUnique({
            where: { userId },
        });
        if (!userPoints)
            return { coins: 0, newBalance: 0 };
        const currentBalance = userPoints.currentPoints;
        const newBalance = Math.max(0, currentBalance - deduction);
        await this.prisma.userPoints.update({
            where: { userId },
            data: {
                currentPoints: newBalance,
                redListDeductions: { increment: deduction },
            },
        });
        await this.prisma.coinTransaction.create({
            data: {
                userId,
                fileId,
                amount: -deduction,
                balanceAfter: newBalance,
                transactionType: 'red_flag_deduction',
                description: `Deducted ${deduction} coins for ${flagType}`,
            },
        });
        const threshold = Number(config.coinThreshold);
        if (currentBalance >= threshold && newBalance < threshold) {
            await this.sendLowCoinsNotification(userId, newBalance);
        }
        return { coins: -deduction, newBalance };
    }
    async logWorkingHours(userId, date, hours, isManual = false) {
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);
        return this.prisma.workingHours.upsert({
            where: {
                userId_date: {
                    userId: userId,
                    date: dateOnly,
                },
            },
            update: {
                hoursWorked: isManual ? hours : undefined,
                hoursLogged: isManual ? hours : undefined,
                isLogged: isManual,
            },
            create: {
                userId,
                date: dateOnly,
                hoursWorked: hours,
                hoursLogged: isManual ? hours : undefined,
                isLogged: isManual,
                filesProcessed: 0,
                filesCreated: 0,
            },
        });
    }
    async calculateWorkingHoursFromActivity(userId, date) {
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);
        const nextDay = new Date(dateOnly);
        nextDay.setDate(nextDay.getDate() + 1);
        const filesProcessed = await this.prisma.fileRouting.count({
            where: {
                fromUserId: userId,
                createdAt: {
                    gte: dateOnly,
                    lt: nextDay,
                },
                action: {
                    in: ['FORWARDED', 'APPROVED', 'REJECTED', 'DISPATCHED'],
                },
            },
        });
        const filesCreated = await this.prisma.file.count({
            where: {
                createdById: userId,
                createdAt: {
                    gte: dateOnly,
                    lt: nextDay,
                },
            },
        });
        const estimatedHours = (filesProcessed * 0.5) + (filesCreated * 0.3);
        await this.prisma.workingHours.upsert({
            where: {
                userId_date: {
                    userId,
                    date: dateOnly,
                },
            },
            update: {
                filesProcessed,
                filesCreated,
                hoursWorked: estimatedHours,
            },
            create: {
                userId,
                date: dateOnly,
                filesProcessed,
                filesCreated,
                hoursWorked: estimatedHours,
                isLogged: false,
            },
        });
        await this.checkHoursBadges(userId, dateOnly, estimatedHours);
        return { filesProcessed, filesCreated, estimatedHours };
    }
    async checkHoursBadges(userId, date, hours) {
        const config = await this.getDefaultConfig();
        const optimumHours = Number(config.optimumHours);
        await this.prisma.performanceBadge.deleteMany({
            where: {
                userId,
                badgeType: { in: ['low_hours', 'extended_hours'] },
                awardedAt: {
                    gte: new Date(date.setHours(0, 0, 0, 0)),
                    lt: new Date(date.setHours(23, 59, 59, 999)),
                },
            },
        });
        if (hours < optimumHours * 0.5) {
            await this.prisma.performanceBadge.create({
                data: {
                    userId,
                    badgeType: 'low_hours',
                    badgeName: 'Low Hours Indicator',
                    description: `Worked ${hours.toFixed(1)} hours (below 50% of optimum ${optimumHours} hours)`,
                    metricValue: hours,
                    threshold: optimumHours * 0.5,
                },
            });
        }
        else if (hours > optimumHours * 1.5) {
            await this.prisma.performanceBadge.create({
                data: {
                    userId,
                    badgeType: 'extended_hours',
                    badgeName: 'Extended Hours Indicator',
                    description: `Worked ${hours.toFixed(1)} hours (above 150% of optimum ${optimumHours} hours)`,
                    metricValue: hours,
                    threshold: optimumHours * 1.5,
                },
            });
        }
    }
    async checkVolumeBadges(deskId) {
        const config = await this.getDefaultConfig();
        const threshold = Number(config.highVolumeThreshold);
        const desk = await this.prisma.desk.findUnique({
            where: { id: deskId },
            include: {
                _count: {
                    select: { files: true },
                },
            },
        });
        if (!desk)
            return;
        const currentFiles = desk._count.files;
        const utilization = (currentFiles / desk.maxFilesPerDay) * 100;
        await this.prisma.performanceBadge.deleteMany({
            where: {
                deskId,
                badgeType: 'high_volume',
            },
        });
        if (utilization > threshold) {
            await this.prisma.performanceBadge.create({
                data: {
                    deskId,
                    badgeType: 'high_volume',
                    badgeName: 'High Volume Desk',
                    description: `Desk has ${currentFiles} files (${utilization.toFixed(1)}% utilization)`,
                    metricValue: utilization,
                    threshold,
                },
            });
        }
    }
    async checkMomentumBadges(deskId, filesProcessedToday) {
        const config = await this.getDefaultConfig();
        const threshold = Number(config.highMomentumThreshold);
        await this.prisma.performanceBadge.deleteMany({
            where: {
                deskId,
                badgeType: 'high_momentum',
                awardedAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        });
        if (filesProcessedToday >= threshold) {
            await this.prisma.performanceBadge.create({
                data: {
                    deskId,
                    badgeType: 'high_momentum',
                    badgeName: 'High Momentum Desk',
                    description: `Processed ${filesProcessedToday} files today`,
                    metricValue: filesProcessedToday,
                    threshold,
                },
            });
        }
    }
    async createRedFlag(data) {
        const flag = await this.prisma.redFlag.create({
            data: {
                userId: data.userId,
                deskId: data.deskId,
                fileId: data.fileId,
                flagType: data.flagType,
                severity: data.severity || 'medium',
                description: data.description,
            },
        });
        if (data.userId) {
            await this.deductCoinsForRedFlag(data.userId, data.fileId || '', data.flagType);
        }
        if (data.userId) {
            await this.checkRedFlagThreshold(data.userId);
        }
        return flag;
    }
    async checkRedFlagThreshold(userId) {
        const config = await this.getDefaultConfig();
        const threshold = Number(config.redFlagThreshold);
        const redFlagCount = await this.prisma.redFlag.count({
            where: {
                userId,
                isResolved: false,
            },
        });
        if (redFlagCount >= threshold) {
            await this.notifications.createNotification({
                userId,
                type: 'red_flag_threshold',
                title: 'Performance Review Required',
                message: `You have ${redFlagCount} unresolved red flags. A review meeting is recommended.`,
                priority: 'high',
                actionRequired: true,
            });
        }
    }
    async sendLowCoinsNotification(userId, balance) {
        await this.notifications.createNotification({
            userId,
            type: 'low_coins',
            title: 'Low Coin Balance',
            message: `Your coin balance (${balance}) has dropped below the threshold. Training or review meeting recommended.`,
            priority: 'high',
            actionRequired: true,
        });
    }
    async getUserPerformance(userId, dateFrom, dateTo) {
        const where = { userId };
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom)
                where.date.gte = dateFrom;
            if (dateTo)
                where.date.lte = dateTo;
        }
        const [workingHours, badges, coins, redFlags] = await Promise.all([
            this.prisma.workingHours.findMany({
                where,
                orderBy: { date: 'desc' },
                take: 30,
            }),
            this.prisma.performanceBadge.findMany({
                where: { userId, isActive: true },
                orderBy: { awardedAt: 'desc' },
            }),
            this.prisma.coinTransaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            this.prisma.redFlag.findMany({
                where: { userId, isResolved: false },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        const userPoints = await this.prisma.userPoints.findUnique({
            where: { userId },
        });
        const totalEarned = coins
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        const totalHours = workingHours.reduce((sum, wh) => sum + wh.hoursWorked, 0);
        const avgHours = workingHours.length > 0 ? totalHours / workingHours.length : 0;
        const totalFilesProcessed = workingHours.reduce((sum, wh) => sum + wh.filesProcessed, 0);
        return {
            currentCoins: userPoints?.currentPoints || 0,
            totalEarned,
            redListDeductions: userPoints?.redListDeductions || 0,
            workingHours: {
                total: totalHours,
                average: avgHours,
                records: workingHours,
            },
            filesProcessed: totalFilesProcessed,
            badges,
            recentTransactions: coins,
            redFlags,
        };
    }
    async getDeskPerformance(deskId) {
        const [badges, redFlags, files] = await Promise.all([
            this.prisma.performanceBadge.findMany({
                where: { deskId, isActive: true },
                orderBy: { awardedAt: 'desc' },
            }),
            this.prisma.redFlag.findMany({
                where: { deskId, isResolved: false },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.file.count({
                where: { deskId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
            }),
        ]);
        const desk = await this.prisma.desk.findUnique({
            where: { id: deskId },
        });
        if (!desk)
            throw new common_1.NotFoundException('Desk not found');
        return {
            desk,
            currentFiles: files,
            badges,
            redFlags,
        };
    }
    async resolveRedFlag(flagId, resolvedBy, resolutionNote) {
        return this.prisma.redFlag.update({
            where: { id: flagId },
            data: {
                isResolved: true,
                resolvedAt: new Date(),
                resolvedBy,
                resolutionNote,
            },
        });
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map