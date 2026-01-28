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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardAnalytics(departmentId, dateFrom, dateTo) {
        const dateFilter = {};
        if (dateFrom)
            dateFilter.gte = dateFrom;
        if (dateTo)
            dateFilter.lte = dateTo;
        const whereBase = {};
        if (departmentId)
            whereBase.departmentId = departmentId;
        if (dateFrom || dateTo)
            whereBase.createdAt = dateFilter;
        const [totalFiles, pendingFiles, inProgressFiles, completedFiles, rejectedFiles, redListedFiles, onHoldFiles, totalUsers, activeUsersToday,] = await Promise.all([
            this.prisma.file.count({ where: whereBase }),
            this.prisma.file.count({ where: { ...whereBase, status: 'PENDING' } }),
            this.prisma.file.count({ where: { ...whereBase, status: 'IN_PROGRESS' } }),
            this.prisma.file.count({ where: { ...whereBase, status: 'APPROVED' } }),
            this.prisma.file.count({ where: { ...whereBase, status: 'REJECTED' } }),
            this.prisma.file.count({ where: { ...whereBase, isRedListed: true } }),
            this.prisma.file.count({ where: { ...whereBase, isOnHold: true } }),
            this.prisma.user.count({ where: departmentId ? { departmentId } : {} }),
            this.prisma.presence.count({
                where: {
                    status: 'ACTIVE',
                    lastPing: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                    ...(departmentId ? { user: { departmentId } } : {}),
                },
            }),
        ]);
        const avgProcessingTime = await this.prisma.file.aggregate({
            where: { ...whereBase, status: 'APPROVED', totalProcessingTime: { not: null } },
            _avg: { totalProcessingTime: true },
        });
        const filesByPriority = await this.prisma.file.groupBy({
            by: ['priority'],
            where: whereBase,
            _count: { id: true },
        });
        const filesByPriorityCategory = await this.prisma.file.groupBy({
            by: ['priorityCategory'],
            where: whereBase,
            _count: { id: true },
        });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let filesPerDay = [];
        try {
            if (departmentId) {
                filesPerDay = await this.prisma.$queryRaw `
          SELECT 
            DATE("createdAt") as date,
            COUNT(*)::int as count
          FROM "File"
          WHERE "createdAt" >= ${thirtyDaysAgo}
          AND "departmentId" = ${departmentId}
          GROUP BY DATE("createdAt")
          ORDER BY date DESC
          LIMIT 30
        `;
            }
            else {
                filesPerDay = await this.prisma.$queryRaw `
          SELECT 
            DATE("createdAt") as date,
            COUNT(*)::int as count
          FROM "File"
          WHERE "createdAt" >= ${thirtyDaysAgo}
          GROUP BY DATE("createdAt")
          ORDER BY date DESC
          LIMIT 30
        `;
            }
        }
        catch (e) {
            filesPerDay = [];
        }
        const extensionStats = await this.prisma.timeExtensionRequest.groupBy({
            by: ['status'],
            _count: { id: true },
        });
        return {
            summary: {
                totalFiles,
                pendingFiles,
                inProgressFiles,
                completedFiles,
                rejectedFiles,
                redListedFiles,
                onHoldFiles,
                totalUsers,
                activeUsersToday,
                avgProcessingTimeHours: avgProcessingTime._avg.totalProcessingTime
                    ? Math.round((avgProcessingTime._avg.totalProcessingTime / 3600) * 10) / 10
                    : null,
                completionRate: totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0,
                redListRate: totalFiles > 0 ? Math.round((redListedFiles / totalFiles) * 100) : 0,
            },
            filesByPriority: filesByPriority.map(p => ({
                priority: p.priority,
                count: p._count.id,
            })),
            filesByPriorityCategory: filesByPriorityCategory.map(p => ({
                category: p.priorityCategory,
                count: p._count.id,
            })),
            filesPerDay,
            extensionStats: extensionStats.map(e => ({
                status: e.status,
                count: e._count.id,
            })),
        };
    }
    async getDepartmentAnalytics() {
        const departments = await this.prisma.department.findMany({
            include: {
                _count: {
                    select: {
                        files: true,
                        users: true,
                    },
                },
            },
        });
        const deptAnalytics = await Promise.all(departments.map(async (dept) => {
            const [pendingCount, inProgressCount, completedCount, redListCount, avgProcessingTime,] = await Promise.all([
                this.prisma.file.count({ where: { departmentId: dept.id, status: 'PENDING' } }),
                this.prisma.file.count({ where: { departmentId: dept.id, status: 'IN_PROGRESS' } }),
                this.prisma.file.count({ where: { departmentId: dept.id, status: 'APPROVED' } }),
                this.prisma.file.count({ where: { departmentId: dept.id, isRedListed: true } }),
                this.prisma.file.aggregate({
                    where: { departmentId: dept.id, status: 'APPROVED', totalProcessingTime: { not: null } },
                    _avg: { totalProcessingTime: true },
                }),
            ]);
            const userPointsAvg = await this.prisma.userPoints.aggregate({
                where: { user: { departmentId: dept.id } },
                _avg: { currentPoints: true },
            });
            return {
                id: dept.id,
                name: dept.name,
                code: dept.code,
                totalFiles: dept._count.files,
                totalUsers: dept._count.users,
                pendingFiles: pendingCount,
                inProgressFiles: inProgressCount,
                completedFiles: completedCount,
                redListedFiles: redListCount,
                avgProcessingTimeHours: avgProcessingTime._avg.totalProcessingTime
                    ? Math.round((avgProcessingTime._avg.totalProcessingTime / 3600) * 10) / 10
                    : null,
                avgUserPoints: Math.round(userPointsAvg._avg.currentPoints || 0),
                efficiency: dept._count.files > 0
                    ? Math.round((completedCount / dept._count.files) * 100)
                    : 0,
            };
        }));
        return deptAnalytics;
    }
    async getUserPerformanceAnalytics(departmentId, limit = 50) {
        const whereUser = { isActive: true };
        if (departmentId)
            whereUser.departmentId = departmentId;
        const users = await this.prisma.user.findMany({
            where: whereUser,
            include: {
                points: true,
                department: { select: { name: true, code: true } },
                division: { select: { name: true } },
                _count: {
                    select: {
                        filesAssigned: true,
                        filesCreated: true,
                    },
                },
            },
            take: limit,
        });
        const userAnalytics = await Promise.all(users.map(async (user) => {
            const [completedFiles, redListedFiles, avgProcessingTime, extensionRequests,] = await Promise.all([
                this.prisma.file.count({
                    where: { assignedToId: user.id, status: 'APPROVED' },
                }),
                this.prisma.file.count({
                    where: { assignedToId: user.id, isRedListed: true },
                }),
                this.prisma.fileRouting.aggregate({
                    where: { fromUserId: user.id, timeSpentAtDesk: { not: null } },
                    _avg: { timeSpentAtDesk: true },
                }),
                this.prisma.timeExtensionRequest.count({
                    where: { requestedById: user.id },
                }),
            ]);
            return {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                department: user.department?.name,
                departmentCode: user.department?.code,
                division: user.division?.name,
                currentPoints: user.points?.currentPoints || 0,
                basePoints: user.points?.basePoints || 1000,
                streakMonths: user.points?.streakMonths || 0,
                totalFilesAssigned: user._count.filesAssigned,
                totalFilesCreated: user._count.filesCreated,
                completedFiles,
                redListedFiles,
                extensionRequests,
                avgProcessingTimeHours: avgProcessingTime._avg.timeSpentAtDesk
                    ? Math.round((avgProcessingTime._avg.timeSpentAtDesk / 3600) * 10) / 10
                    : null,
                performanceScore: this.calculatePerformanceScore(completedFiles, redListedFiles, user.points?.currentPoints || 1000, extensionRequests),
            };
        }));
        return userAnalytics.sort((a, b) => b.performanceScore - a.performanceScore);
    }
    async getProcessingTimeAnalytics(departmentId) {
        const where = { status: 'APPROVED', totalProcessingTime: { not: null } };
        if (departmentId)
            where.departmentId = departmentId;
        const byCategory = await this.prisma.file.groupBy({
            by: ['priorityCategory'],
            where,
            _avg: { totalProcessingTime: true },
            _count: { id: true },
        });
        const byDepartment = await this.prisma.file.groupBy({
            by: ['departmentId'],
            where: { status: 'APPROVED', totalProcessingTime: { not: null } },
            _avg: { totalProcessingTime: true },
            _count: { id: true },
        });
        const deptIds = byDepartment.map(d => d.departmentId);
        const departments = await this.prisma.department.findMany({
            where: { id: { in: deptIds } },
            select: { id: true, name: true, code: true },
        });
        const deptMap = new Map(departments.map(d => [d.id, d]));
        return {
            byPriorityCategory: byCategory.map(c => ({
                category: c.priorityCategory,
                avgTimeHours: c._avg.totalProcessingTime
                    ? Math.round((c._avg.totalProcessingTime / 3600) * 10) / 10
                    : null,
                count: c._count.id,
            })),
            byDepartment: byDepartment.map(d => ({
                departmentId: d.departmentId,
                departmentName: deptMap.get(d.departmentId)?.name,
                departmentCode: deptMap.get(d.departmentId)?.code,
                avgTimeHours: d._avg.totalProcessingTime
                    ? Math.round((d._avg.totalProcessingTime / 3600) * 10) / 10
                    : null,
                count: d._count.id,
            })),
        };
    }
    async getBottleneckAnalysis(departmentId) {
        const where = { status: { in: ['PENDING', 'IN_PROGRESS'] } };
        if (departmentId)
            where.departmentId = departmentId;
        const filesPerUser = await this.prisma.file.groupBy({
            by: ['assignedToId'],
            where: { ...where, assignedToId: { not: null } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });
        const userIds = filesPerUser.map(f => f.assignedToId).filter(Boolean);
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, department: { select: { name: true } } },
        });
        const userMap = new Map(users.map(u => [u.id, u]));
        const filesPerDivision = await this.prisma.file.groupBy({
            by: ['currentDivisionId'],
            where: { ...where, currentDivisionId: { not: null } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });
        const divisionIds = filesPerDivision.map(f => f.currentDivisionId).filter(Boolean);
        const divisions = await this.prisma.division.findMany({
            where: { id: { in: divisionIds } },
            select: { id: true, name: true, department: { select: { name: true } } },
        });
        const divisionMap = new Map(divisions.map(d => [d.id, d]));
        const overdueFiles = await this.prisma.file.findMany({
            where: {
                ...where,
                OR: [
                    { dueDate: { lt: new Date() } },
                    { deskDueDate: { lt: new Date() } },
                ],
            },
            include: {
                assignedTo: { select: { id: true, name: true } },
                currentDivision: { select: { name: true } },
                department: { select: { name: true } },
            },
            orderBy: { dueDate: 'asc' },
            take: 20,
        });
        return {
            userBottlenecks: filesPerUser.map(f => ({
                userId: f.assignedToId,
                userName: userMap.get(f.assignedToId)?.name,
                department: userMap.get(f.assignedToId)?.department?.name,
                pendingFiles: f._count.id,
            })),
            divisionBottlenecks: filesPerDivision.map(f => ({
                divisionId: f.currentDivisionId,
                divisionName: divisionMap.get(f.currentDivisionId)?.name,
                department: divisionMap.get(f.currentDivisionId)?.department?.name,
                pendingFiles: f._count.id,
            })),
            overdueFiles: overdueFiles.map(f => ({
                id: f.id,
                fileNumber: f.fileNumber,
                subject: f.subject,
                assignedTo: f.assignedTo?.name,
                division: f.currentDivision?.name,
                department: f.department.name,
                dueDate: f.dueDate,
                daysOverdue: f.dueDate
                    ? Math.floor((Date.now() - f.dueDate.getTime()) / (1000 * 60 * 60 * 24))
                    : null,
            })),
        };
    }
    async generateReport(reportType, departmentId, dateFrom, dateTo) {
        switch (reportType) {
            case 'summary':
                return this.getDashboardAnalytics(departmentId, dateFrom, dateTo);
            case 'detailed':
                const files = await this.prisma.file.findMany({
                    where: {
                        ...(departmentId ? { departmentId } : {}),
                        ...(dateFrom || dateTo ? {
                            createdAt: {
                                ...(dateFrom ? { gte: dateFrom } : {}),
                                ...(dateTo ? { lte: dateTo } : {}),
                            },
                        } : {}),
                    },
                    include: {
                        createdBy: { select: { name: true } },
                        assignedTo: { select: { name: true } },
                        department: { select: { name: true, code: true } },
                        currentDivision: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                });
                return {
                    generatedAt: new Date(),
                    totalRecords: files.length,
                    files: files.map(f => ({
                        fileNumber: f.fileNumber,
                        subject: f.subject,
                        status: f.status,
                        priority: f.priority,
                        priorityCategory: f.priorityCategory,
                        department: f.department.name,
                        departmentCode: f.department.code,
                        division: f.currentDivision?.name || '-',
                        createdBy: f.createdBy.name,
                        assignedTo: f.assignedTo?.name || 'Unassigned',
                        createdAt: f.createdAt,
                        dueDate: f.dueDate,
                        isRedListed: f.isRedListed,
                        isOnHold: f.isOnHold,
                    })),
                };
            case 'user_performance':
                return {
                    generatedAt: new Date(),
                    users: await this.getUserPerformanceAnalytics(departmentId),
                };
            case 'department':
                return {
                    generatedAt: new Date(),
                    departments: await this.getDepartmentAnalytics(),
                };
            default:
                throw new Error('Invalid report type');
        }
    }
    calculatePerformanceScore(completed, redListed, points, extensionRequests) {
        const completedWeight = 10;
        const redListPenalty = -20;
        const pointsWeight = 0.05;
        const extensionPenalty = -5;
        let score = 50;
        score += completed * completedWeight;
        score += redListed * redListPenalty;
        score += (points - 1000) * pointsWeight;
        score += extensionRequests * extensionPenalty;
        return Math.max(0, Math.min(100, Math.round(score)));
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map