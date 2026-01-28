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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AdminService = class AdminService {
    prisma;
    HEARTBEAT_TIMEOUT = 3 * 60 * 1000;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDeskStatus(departmentId, userRole) {
        const where = { isActive: true };
        if (userRole === 'DEPT_ADMIN') {
            where.departmentId = departmentId;
        }
        const users = await this.prisma.user.findMany({
            where,
            include: {
                department: { select: { id: true, name: true, code: true } },
                division: { select: { id: true, name: true, code: true } },
                presence: true,
                _count: {
                    select: {
                        filesAssigned: {
                            where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
                        },
                    },
                },
            },
            orderBy: [
                { department: { name: 'asc' } },
                { division: { name: 'asc' } },
                { name: 'asc' },
            ],
        });
        const now = Date.now();
        return users.map(user => {
            let status = client_1.PresenceStatus.ABSENT;
            let statusLabel = 'Absent';
            let logoutType = null;
            if (user.presence && user.presence.length > 0) {
                const presence = user.presence[0];
                const timeSinceLastPing = now - presence.lastPing.getTime();
                if (timeSinceLastPing <= this.HEARTBEAT_TIMEOUT) {
                    status = client_1.PresenceStatus.ACTIVE;
                    statusLabel = 'Active';
                }
                else if (presence.logoutType === 'manual') {
                    status = client_1.PresenceStatus.ABSENT;
                    statusLabel = 'Logged Out';
                    logoutType = 'manual';
                }
                else {
                    status = client_1.PresenceStatus.SESSION_TIMEOUT;
                    statusLabel = 'Session Expired';
                    logoutType = 'session_timeout';
                }
            }
            return {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                department: user.department,
                division: user.division,
                status,
                statusLabel,
                logoutType,
                lastPing: user.presence?.[0]?.lastPing,
                loginTime: user.presence?.[0]?.loginTime,
                logoutTime: user.presence?.[0]?.logoutTime,
                pendingFiles: user._count.filesAssigned,
            };
        });
    }
    async getDepartmentFiles(departmentId, userRole, filters) {
        const { status, search, isRedListed, assignedToId, page = 1, limit = 50 } = filters;
        const where = {};
        if (userRole === 'DEPT_ADMIN' && departmentId) {
            where.departmentId = departmentId;
        }
        if (status)
            where.status = status;
        if (isRedListed !== undefined)
            where.isRedListed = isRedListed;
        if (assignedToId)
            where.assignedToId = assignedToId;
        if (search) {
            where.OR = [
                { fileNumber: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [files, total] = await Promise.all([
            this.prisma.file.findMany({
                where,
                include: {
                    department: { select: { id: true, name: true, code: true } },
                    currentDivision: { select: { id: true, name: true, code: true } },
                    assignedTo: { select: { id: true, name: true } },
                    createdBy: { select: { id: true, name: true } },
                },
                orderBy: [
                    { isRedListed: 'desc' },
                    { updatedAt: 'desc' },
                ],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.file.count({ where }),
        ]);
        return {
            data: files,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getAnalytics(departmentId, userRole) {
        const where = {};
        if (userRole === 'DEPT_ADMIN' && departmentId) {
            where.departmentId = departmentId;
        }
        const userPointsQuery = {};
        if (departmentId && userRole === 'DEPT_ADMIN') {
            userPointsQuery.user = { departmentId };
        }
        const [totalFiles, pendingFiles, redListedFiles, completedFiles, userPoints, extensionRequests, avgProcessingTime,] = await Promise.all([
            this.prisma.file.count({ where }),
            this.prisma.file.count({ where: { ...where, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
            this.prisma.file.count({ where: { ...where, isRedListed: true } }),
            this.prisma.file.count({ where: { ...where, status: 'APPROVED' } }),
            this.prisma.userPoints.findMany({
                where: userPointsQuery,
                include: {
                    user: {
                        select: { id: true, name: true, role: true, departmentId: true },
                    },
                },
                orderBy: { currentPoints: 'desc' },
            }),
            this.prisma.timeExtensionRequest.count({
                where: departmentId && userRole === 'DEPT_ADMIN'
                    ? { file: { departmentId } }
                    : {},
            }),
            this.prisma.file.aggregate({
                where: {
                    ...where,
                    status: 'APPROVED',
                    totalProcessingTime: { not: null },
                },
                _avg: { totalProcessingTime: true },
            }),
        ]);
        const scores = userPoints.map(up => ({
            userId: up.userId,
            userName: up.user.name,
            role: up.user.role,
            currentPoints: up.currentPoints,
            basePoints: up.basePoints,
            redListCount: up.redListCount,
            monthlyBonus: up.monthlyBonus,
            streakMonths: up.streakMonths,
        }));
        const avgScore = scores.length > 0
            ? scores.reduce((sum, s) => sum + s.currentPoints, 0) / scores.length
            : 0;
        return {
            summary: {
                totalFiles,
                pendingFiles,
                redListedFiles,
                completedFiles,
                extensionRequests,
                avgProcessingTimeHours: avgProcessingTime._avg.totalProcessingTime
                    ? Math.round(avgProcessingTime._avg.totalProcessingTime / 3600 * 10) / 10
                    : null,
            },
            scores: {
                highest: scores[0] || null,
                lowest: scores[scores.length - 1] || null,
                average: Math.round(avgScore),
                all: scores,
            },
        };
    }
    async getDepartmentWiseAnalytics() {
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
        const deptStats = await Promise.all(departments.map(async (dept) => {
            const [pendingCount, redListCount, completedCount, avgProcessingTime,] = await Promise.all([
                this.prisma.file.count({
                    where: { departmentId: dept.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
                }),
                this.prisma.file.count({
                    where: { departmentId: dept.id, isRedListed: true },
                }),
                this.prisma.file.count({
                    where: { departmentId: dept.id, status: 'APPROVED' },
                }),
                this.prisma.file.aggregate({
                    where: {
                        departmentId: dept.id,
                        status: 'APPROVED',
                        totalProcessingTime: { not: null },
                    },
                    _avg: { totalProcessingTime: true },
                }),
            ]);
            const deptUserPoints = await this.prisma.userPoints.aggregate({
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
                redListedFiles: redListCount,
                completedFiles: completedCount,
                avgProcessingTimeHours: avgProcessingTime._avg.totalProcessingTime
                    ? Math.round(avgProcessingTime._avg.totalProcessingTime / 3600 * 10) / 10
                    : null,
                avgUserPoints: Math.round(deptUserPoints._avg.currentPoints || 0),
            };
        }));
        return deptStats;
    }
    async getSettings(departmentId) {
        const where = {};
        if (departmentId) {
            where.OR = [
                { departmentId: null },
                { departmentId },
            ];
        }
        return this.prisma.systemSettings.findMany({ where });
    }
    async updateSetting(key, value, userId, departmentId) {
        return this.prisma.systemSettings.upsert({
            where: { key },
            create: {
                key,
                value,
                departmentId,
                updatedById: userId,
            },
            update: {
                value,
                updatedById: userId,
            },
        });
    }
    async getExtensionRequests(departmentId, userRole) {
        const where = {};
        if (userRole === 'DEPT_ADMIN' && departmentId) {
            where.file = { departmentId };
        }
        return this.prisma.timeExtensionRequest.findMany({
            where,
            include: {
                file: {
                    select: {
                        id: true,
                        fileNumber: true,
                        subject: true,
                        departmentId: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async getRedListedFiles(departmentId, userRole) {
        const where = { isRedListed: true };
        if (userRole === 'DEPT_ADMIN' && departmentId) {
            where.departmentId = departmentId;
        }
        return this.prisma.file.findMany({
            where,
            include: {
                department: { select: { id: true, name: true, code: true } },
                assignedTo: { select: { id: true, name: true } },
                currentDivision: { select: { id: true, name: true } },
            },
            orderBy: { redListedAt: 'desc' },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map