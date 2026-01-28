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
exports.BackFilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../minio/minio.service");
const client_1 = require("@prisma/client");
let BackFilesService = class BackFilesService {
    prisma;
    minio;
    constructor(prisma, minio) {
        this.prisma = prisma;
        this.minio = minio;
    }
    async createBackFile(userId, userRole, data) {
        const existing = await this.prisma.backFile.findUnique({
            where: { fileNumber: data.fileNumber },
        });
        if (existing) {
            throw new common_1.ForbiddenException('Back file with this file number already exists');
        }
        let s3Key;
        if (data.file) {
            s3Key = `backfiles/${data.departmentId}/${Date.now()}-${data.file.filename}`;
            await this.minio.uploadFile(s3Key, data.file.buffer, data.file.mimetype);
        }
        const backFile = await this.prisma.backFile.create({
            data: {
                fileNumber: data.fileNumber,
                subject: data.subject,
                description: data.description,
                departmentId: data.departmentId,
                s3Key,
                s3Bucket: this.minio.getBucketName(),
                isScanned: !!data.file,
                scannedAt: data.file ? new Date() : undefined,
                scannedById: data.file ? userId : undefined,
                isHidden: true,
                accessRoles: [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN],
            },
        });
        if (data.tags && data.tags.length > 0) {
            await Promise.all(data.tags.map(tag => this.prisma.backFileTag.create({
                data: {
                    backFileId: backFile.id,
                    tagName: tag.name,
                    tagValue: tag.value,
                },
            })));
        }
        return backFile;
    }
    async linkBackFileToFile(userId, fileId, backFileId, linkReason) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        const backFile = await this.prisma.backFile.findUnique({
            where: { id: backFileId },
        });
        if (!backFile) {
            throw new common_1.NotFoundException('Back file not found');
        }
        const existingLink = await this.prisma.fileBackFileLink.findUnique({
            where: {
                fileId_backFileId: {
                    fileId,
                    backFileId,
                },
            },
        });
        if (existingLink) {
            throw new common_1.ForbiddenException('Back file is already linked to this file');
        }
        const link = await this.prisma.fileBackFileLink.create({
            data: {
                fileId,
                backFileId,
                linkReason,
                linkedById: userId,
            },
        });
        await this.prisma.file.update({
            where: { id: fileId },
            data: { hasBackFiles: true },
        });
        return link;
    }
    async getBackFilesForFile(fileId, userId, userRole) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        const links = await this.prisma.fileBackFileLink.findMany({
            where: { fileId },
            include: {
                backFile: {
                    include: {
                        tags: true,
                        department: { select: { name: true, code: true } },
                    },
                },
                linkedBy: { select: { name: true } },
            },
        });
        const accessibleBackFiles = links.filter(link => {
            const backFile = link.backFile;
            if (userRole === client_1.UserRole.SUPER_ADMIN)
                return true;
            if (backFile.accessRoles.includes(userRole))
                return true;
            if (backFile.departmentId === file.departmentId)
                return true;
            return false;
        });
        return accessibleBackFiles.map(link => ({
            ...link.backFile,
            linkReason: link.linkReason,
            linkedBy: link.linkedBy,
            linkedAt: link.createdAt,
        }));
    }
    async getBackFiles(userId, userRole, filters) {
        const where = {};
        if (userRole !== client_1.UserRole.SUPER_ADMIN) {
            where.OR = [
                { accessRoles: { has: userRole } },
                { department: { users: { some: { id: userId } } } },
            ];
        }
        if (filters?.departmentId) {
            where.departmentId = filters.departmentId;
        }
        if (filters?.isHidden !== undefined) {
            where.isHidden = filters.isHidden;
        }
        if (filters?.tagName) {
            where.tags = { some: { tagName: filters.tagName } };
        }
        if (filters?.search) {
            where.OR = [
                ...(where.OR || []),
                { fileNumber: { contains: filters.search, mode: 'insensitive' } },
                { subject: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.backFile.findMany({
            where,
            include: {
                department: { select: { name: true, code: true } },
                tags: true,
                _count: {
                    select: { linkedFiles: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getBackFileById(backFileId, userId, userRole) {
        const backFile = await this.prisma.backFile.findUnique({
            where: { id: backFileId },
            include: {
                department: { select: { name: true, code: true } },
                tags: true,
                linkedFiles: {
                    include: {
                        file: {
                            select: {
                                id: true,
                                fileNumber: true,
                                subject: true,
                            },
                        },
                    },
                },
            },
        });
        if (!backFile) {
            throw new common_1.NotFoundException('Back file not found');
        }
        if (userRole !== client_1.UserRole.SUPER_ADMIN) {
            if (!backFile.accessRoles.includes(userRole)) {
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { departmentId: true },
                });
                if (user?.departmentId !== backFile.departmentId) {
                    throw new common_1.ForbiddenException('You do not have access to this back file');
                }
            }
        }
        return backFile;
    }
    async updateBackFileAccess(backFileId, userId, userRole, data) {
        if (userRole !== client_1.UserRole.SUPER_ADMIN && userRole !== client_1.UserRole.DEPT_ADMIN) {
            throw new common_1.ForbiddenException('Only administrators can update back file access');
        }
        return this.prisma.backFile.update({
            where: { id: backFileId },
            data: {
                isHidden: data.isHidden,
                accessRoles: data.accessRoles,
            },
        });
    }
    async addTag(backFileId, tagName, tagValue) {
        return this.prisma.backFileTag.create({
            data: {
                backFileId,
                tagName,
                tagValue,
            },
        });
    }
    async removeTag(tagId) {
        return this.prisma.backFileTag.delete({
            where: { id: tagId },
        });
    }
    async unlinkBackFile(fileId, backFileId) {
        await this.prisma.fileBackFileLink.delete({
            where: {
                fileId_backFileId: {
                    fileId,
                    backFileId,
                },
            },
        });
        const remainingLinks = await this.prisma.fileBackFileLink.count({
            where: { fileId },
        });
        if (remainingLinks === 0) {
            await this.prisma.file.update({
                where: { id: fileId },
                data: { hasBackFiles: false },
            });
        }
        return { message: 'Back file unlinked successfully' };
    }
    async downloadBackFile(backFileId, userId, userRole) {
        const backFile = await this.getBackFileById(backFileId, userId, userRole);
        if (!backFile.s3Key) {
            throw new common_1.NotFoundException('Back file document not found');
        }
        const stream = await this.minio.getFileStream(backFile.s3Key);
        const filename = backFile.s3Key.split('/').pop() || `backfile-${backFile.fileNumber}.pdf`;
        return { stream, filename, mimeType: 'application/pdf' };
    }
};
exports.BackFilesService = BackFilesService;
exports.BackFilesService = BackFilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinIOService])
], BackFilesService);
//# sourceMappingURL=backfiles.service.js.map