"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllUsers(filters) {
        const where = {};
        if (filters?.departmentId) {
            where.departmentId = filters.departmentId;
        }
        if (filters?.role) {
            where.role = filters.role;
        }
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { username: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                department: { select: { id: true, name: true, code: true } },
                division: { select: { id: true, name: true } },
                points: { select: { currentPoints: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async getUserById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                department: { select: { id: true, name: true, code: true } },
                division: { select: { id: true, name: true } },
                points: true,
                _count: {
                    select: {
                        filesCreated: true,
                        filesAssigned: true,
                        notes: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async createUser(data) {
        const existing = await this.prisma.user.findUnique({
            where: { username: data.username },
        });
        if (existing) {
            throw new common_1.ConflictException('Username already exists');
        }
        const passwordHash = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                username: data.username,
                passwordHash,
                name: data.name,
                email: data.email,
                role: data.role,
                departmentId: data.departmentId,
                divisionId: data.divisionId,
            },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                department: { select: { id: true, name: true } },
                division: { select: { id: true, name: true } },
            },
        });
        await this.prisma.userPoints.create({
            data: {
                userId: user.id,
                basePoints: 1000,
                currentPoints: 1000,
            },
        });
        return user;
    }
    async updateUser(id, data) {
        return this.prisma.user.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.email !== undefined && { email: data.email }),
                ...(data.role && { role: data.role }),
                ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
                ...(data.divisionId !== undefined && { divisionId: data.divisionId }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                department: { select: { id: true, name: true } },
                division: { select: { id: true, name: true } },
            },
        });
    }
    async changePassword(id, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
        return { message: 'Password changed successfully' };
    }
    async resetPassword(id, newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
        return { message: 'Password reset successfully' };
    }
    async deactivateUser(id) {
        return this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map