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
exports.DesksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DesksService = class DesksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createDesk(userId, userRole, data) {
        if (userRole !== client_1.UserRole.SUPER_ADMIN && userRole !== client_1.UserRole.DEPT_ADMIN) {
            throw new common_1.ForbiddenException('Only administrators can create desks');
        }
        const existing = await this.prisma.desk.findUnique({
            where: { code: data.code },
        });
        if (existing) {
            throw new common_1.ForbiddenException('Desk code already exists');
        }
        return this.prisma.desk.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                departmentId: data.departmentId,
                divisionId: data.divisionId,
                maxFilesPerDay: data.maxFilesPerDay || 10,
                iconType: data.iconType || 'desk',
                isActive: true,
                isAutoCreated: false,
            },
        });
    }
    async getDesks(departmentId, divisionId) {
        const where = { isActive: true };
        if (departmentId) {
            where.departmentId = departmentId;
        }
        if (divisionId) {
            where.divisionId = divisionId;
        }
        const desks = await this.prisma.desk.findMany({
            where,
            include: {
                department: { select: { name: true, code: true } },
                division: { select: { name: true } },
                _count: {
                    select: { files: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return desks.map(desk => {
            const currentCount = desk._count.files;
            const utilization = desk.maxFilesPerDay > 0
                ? (currentCount / desk.maxFilesPerDay) * 100
                : 0;
            const estimatedDays = currentCount > 0
                ? Math.ceil(currentCount / desk.maxFilesPerDay)
                : 0;
            const estimatedHours = estimatedDays * 8;
            return {
                ...desk,
                currentFileCount: currentCount,
                capacityUtilizationPercent: Math.round(utilization * 100) / 100,
                optimumCapacity: desk.maxFilesPerDay,
                estimatedProcessingTimeDays: estimatedDays,
                estimatedProcessingTimeHours: estimatedHours,
            };
        });
    }
    async getDeskById(deskId) {
        const desk = await this.prisma.desk.findUnique({
            where: { id: deskId },
            include: {
                department: { select: { name: true, code: true } },
                division: { select: { name: true } },
                files: {
                    include: {
                        assignedTo: { select: { name: true } },
                        createdBy: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!desk) {
            throw new common_1.NotFoundException('Desk not found');
        }
        const utilization = desk.maxFilesPerDay > 0
            ? (desk.files.length / desk.maxFilesPerDay) * 100
            : 0;
        return {
            ...desk,
            currentFileCount: desk.files.length,
            capacityUtilizationPercent: Math.round(utilization * 100) / 100,
        };
    }
    async assignFileToDesk(fileId, deskId, userId, userRole) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        const desk = await this.prisma.desk.findUnique({
            where: { id: deskId },
        });
        if (!desk) {
            throw new common_1.NotFoundException('Desk not found');
        }
        if (userRole !== client_1.UserRole.SUPER_ADMIN &&
            userRole !== client_1.UserRole.DEPT_ADMIN &&
            file.assignedToId !== userId) {
            throw new common_1.ForbiddenException('You are not authorized to assign files to desks');
        }
        const currentCount = await this.prisma.file.count({
            where: { deskId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        });
        if (currentCount >= desk.maxFilesPerDay) {
            throw new common_1.ForbiddenException('Desk capacity reached. Please select another desk or create a new one.');
        }
        return this.prisma.file.update({
            where: { id: fileId },
            data: { deskId },
        });
    }
    async updateDeskCapacity(deskId) {
        const desk = await this.prisma.desk.findUnique({
            where: { id: deskId },
        });
        if (!desk) {
            throw new common_1.NotFoundException('Desk not found');
        }
        const currentCount = await this.prisma.file.count({
            where: {
                deskId,
                status: { in: ['PENDING', 'IN_PROGRESS'] },
            },
        });
        const utilization = desk.maxFilesPerDay > 0
            ? (currentCount / desk.maxFilesPerDay) * 100
            : 0;
        return this.prisma.desk.update({
            where: { id: deskId },
            data: {
                currentFileCount: currentCount,
                capacityUtilizationPercent: utilization,
                optimumCapacity: desk.maxFilesPerDay,
            },
        });
    }
    async autoCreateDesk(departmentId, divisionId) {
        const existingDesks = await this.prisma.desk.findMany({
            where: {
                departmentId,
                divisionId: divisionId || null,
                isActive: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const nextNumber = existingDesks.length + 1;
        const deskCode = divisionId
            ? `DESK-${departmentId.substring(0, 3).toUpperCase()}-${nextNumber}`
            : `DESK-${departmentId.substring(0, 3).toUpperCase()}-${nextNumber}`;
        const department = await this.prisma.department.findUnique({
            where: { id: departmentId },
            select: { code: true },
        });
        return this.prisma.desk.create({
            data: {
                name: `Desk ${nextNumber}`,
                code: `${department?.code || 'DEPT'}-DESK-${nextNumber}`,
                description: 'Auto-created when capacity reached',
                departmentId,
                divisionId,
                maxFilesPerDay: 10,
                isActive: true,
                isAutoCreated: true,
            },
        });
    }
    async checkAndAutoCreateDesk(departmentId, divisionId) {
        const desks = await this.getDesks(departmentId, divisionId);
        const fullDesks = desks.filter(d => d.capacityUtilizationPercent >= 100);
        if (fullDesks.length > 0) {
            const availableDesks = desks.filter(d => d.capacityUtilizationPercent < 100);
            if (availableDesks.length === 0) {
                return this.autoCreateDesk(departmentId, divisionId);
            }
        }
        return null;
    }
    async getDeskWorkloadSummary(departmentId) {
        const where = { isActive: true };
        if (departmentId) {
            where.departmentId = departmentId;
        }
        const desks = await this.prisma.desk.findMany({
            where,
            include: {
                department: { select: { name: true, code: true } },
                division: { select: { name: true } },
                _count: {
                    select: {
                        files: {
                            where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
                        },
                    },
                },
            },
        });
        const totalFiles = desks.reduce((sum, d) => sum + d._count.files, 0);
        const totalCapacity = desks.reduce((sum, d) => sum + d.maxFilesPerDay, 0);
        const overallUtilization = totalCapacity > 0
            ? (totalFiles / totalCapacity) * 100
            : 0;
        return {
            totalDesks: desks.length,
            activeDesks: desks.filter(d => d._count.files > 0).length,
            totalFiles,
            totalCapacity,
            overallUtilization: Math.round(overallUtilization * 100) / 100,
            desks: desks.map(d => ({
                id: d.id,
                name: d.name,
                code: d.code,
                currentFiles: d._count.files,
                maxFiles: d.maxFilesPerDay,
                utilization: d.maxFilesPerDay > 0
                    ? Math.round((d._count.files / d.maxFilesPerDay) * 100 * 100) / 100
                    : 0,
                isFull: d._count.files >= d.maxFilesPerDay,
                department: d.department,
                division: d.division,
            })),
        };
    }
    async updateDesk(deskId, userId, userRole, data) {
        if (userRole !== client_1.UserRole.SUPER_ADMIN && userRole !== client_1.UserRole.DEPT_ADMIN) {
            throw new common_1.ForbiddenException('Only administrators can update desks');
        }
        return this.prisma.desk.update({
            where: { id: deskId },
            data,
        });
    }
    async deleteDesk(deskId, userId, userRole) {
        if (userRole !== client_1.UserRole.SUPER_ADMIN && userRole !== client_1.UserRole.DEPT_ADMIN) {
            throw new common_1.ForbiddenException('Only administrators can delete desks');
        }
        const fileCount = await this.prisma.file.count({
            where: { deskId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        });
        if (fileCount > 0) {
            throw new common_1.ForbiddenException('Cannot delete desk with active files. Please reassign files first.');
        }
        return this.prisma.desk.update({
            where: { id: deskId },
            data: { isActive: false },
        });
    }
};
exports.DesksService = DesksService;
exports.DesksService = DesksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DesksService);
//# sourceMappingURL=desks.service.js.map