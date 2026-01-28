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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DepartmentsService = class DepartmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllDepartments() {
        return this.prisma.department.findMany({
            include: {
                organisation: { select: { id: true, name: true } },
                divisions: { select: { id: true, name: true } },
                _count: { select: { users: true, files: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async getDepartmentById(id) {
        const department = await this.prisma.department.findUnique({
            where: { id },
            include: {
                organisation: true,
                divisions: {
                    include: {
                        _count: { select: { users: true } },
                    },
                },
                users: {
                    select: { id: true, name: true, username: true, role: true },
                },
            },
        });
        if (!department) {
            throw new common_1.NotFoundException('Department not found');
        }
        return department;
    }
    async createDepartment(data) {
        return this.prisma.department.create({
            data: {
                name: data.name,
                code: data.code,
                organisationId: data.organisationId,
            },
        });
    }
    async updateDepartment(id, data) {
        return this.prisma.department.update({
            where: { id },
            data,
        });
    }
    async deleteDepartment(id) {
        return this.prisma.department.delete({
            where: { id },
        });
    }
    async getInwardDeskDepartments(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { departmentId: true },
        });
        if (!user?.departmentId) {
            return [];
        }
        return this.prisma.department.findMany({
            where: { id: user.departmentId },
            include: {
                divisions: true,
            },
        });
    }
    async getDivisions(departmentId) {
        return this.prisma.division.findMany({
            where: { departmentId },
            include: {
                _count: { select: { users: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async createDivision(departmentId, name) {
        const code = name.toUpperCase().replace(/\s+/g, '-').substring(0, 10);
        return this.prisma.division.create({
            data: {
                name,
                code,
                departmentId,
            },
        });
    }
    async getDivisionUsers(divisionId) {
        return this.prisma.user.findMany({
            where: {
                divisionId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
            },
            orderBy: { name: 'asc' },
        });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map