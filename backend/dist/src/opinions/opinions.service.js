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
exports.OpinionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const minio_service_1 = require("../minio/minio.service");
const client_1 = require("@prisma/client");
let OpinionsService = class OpinionsService {
    prisma;
    notifications;
    minio;
    constructor(prisma, notifications, minio) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.minio = minio;
    }
    async requestOpinion(fileId, requestedById, data) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
            include: { department: true, createdBy: true },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        if (file.assignedToId !== requestedById && file.createdById !== requestedById) {
            throw new common_1.ForbiddenException('You are not authorized to request opinions for this file');
        }
        const opinionRequest = await this.prisma.opinionRequest.create({
            data: {
                fileId,
                requestedById,
                requestedFromDepartmentId: file.departmentId,
                requestedToDepartmentId: data.requestedToDepartmentId,
                requestedToDivisionId: data.requestedToDivisionId,
                requestedToUserId: data.requestedToUserId,
                requestReason: data.requestReason,
                specialPermissionGranted: data.specialPermissionGranted || false,
                status: 'pending',
            },
            include: {
                requestedToDepartment: { select: { name: true, code: true } },
                requestedToDivision: { select: { name: true } },
            },
        });
        await this.prisma.fileRouting.create({
            data: {
                fileId,
                fromUserId: requestedById,
                action: client_1.FileAction.OPINION_REQUESTED,
                remarks: `Opinion requested from ${opinionRequest.requestedToDepartment.name}`,
            },
        });
        if (data.requestedToUserId) {
            await this.notifications.createNotification({
                userId: data.requestedToUserId,
                type: 'opinion_requested',
                title: 'Opinion Requested',
                message: `File ${file.fileNumber} requires your opinion: ${file.subject}`,
                fileId: file.id,
                metadata: { opinionRequestId: opinionRequest.id },
            });
        }
        else {
            const deptAdmin = await this.prisma.user.findFirst({
                where: {
                    role: 'DEPT_ADMIN',
                    departmentId: data.requestedToDepartmentId,
                },
            });
            if (deptAdmin) {
                await this.notifications.createNotification({
                    userId: deptAdmin.id,
                    type: 'opinion_requested',
                    title: 'Opinion Requested',
                    message: `File ${file.fileNumber} requires opinion from your department`,
                    fileId: file.id,
                    metadata: { opinionRequestId: opinionRequest.id },
                });
            }
        }
        return opinionRequest;
    }
    async getPendingOpinions(userId, departmentId) {
        const where = {
            status: 'pending',
        };
        if (departmentId) {
            where.requestedToDepartmentId = departmentId;
        }
        else {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { departmentId: true },
            });
            if (user?.departmentId) {
                where.requestedToDepartmentId = user.departmentId;
            }
        }
        return this.prisma.opinionRequest.findMany({
            where,
            include: {
                file: {
                    select: {
                        id: true,
                        fileNumber: true,
                        subject: true,
                        description: true,
                        priority: true,
                        priorityCategory: true,
                        createdAt: true,
                        department: { select: { name: true, code: true } },
                        createdBy: { select: { name: true } },
                    },
                },
                requestedBy: { select: { name: true } },
                requestedFromDepartment: { select: { name: true, code: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getFileForOpinion(opinionRequestId, userId) {
        const opinionRequest = await this.prisma.opinionRequest.findUnique({
            where: { id: opinionRequestId },
            include: {
                file: {
                    include: {
                        department: true,
                        createdBy: { select: { name: true } },
                        attachments: {
                            select: {
                                id: true,
                                filename: true,
                                mimeType: true,
                                size: true,
                                createdAt: true,
                            },
                        },
                    },
                },
            },
        });
        if (!opinionRequest) {
            throw new common_1.NotFoundException('Opinion request not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { departmentId: true, divisionId: true },
        });
        if (opinionRequest.requestedToDepartmentId !== user?.departmentId ||
            (opinionRequest.requestedToDivisionId && opinionRequest.requestedToDivisionId !== user?.divisionId)) {
            throw new common_1.ForbiddenException('You are not authorized to view this opinion request');
        }
        let notes;
        if (opinionRequest.specialPermissionGranted) {
            notes = await this.prisma.note.findMany({
                where: { fileId: opinionRequest.fileId },
                include: {
                    user: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        else {
            notes = await this.prisma.note.findMany({
                where: {
                    fileId: opinionRequest.fileId,
                    user: {
                        departmentId: opinionRequest.requestedFromDepartmentId,
                    },
                },
                include: {
                    user: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        const opinionNotes = await this.prisma.opinionNote.findMany({
            where: { opinionRequestId },
            include: {
                addedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            opinionRequest,
            file: {
                ...opinionRequest.file,
                notes,
                opinionNotes,
            },
        };
    }
    async addOpinionNote(opinionRequestId, userId, content) {
        const opinionRequest = await this.prisma.opinionRequest.findUnique({
            where: { id: opinionRequestId },
        });
        if (!opinionRequest) {
            throw new common_1.NotFoundException('Opinion request not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { departmentId: true },
        });
        if (opinionRequest.requestedToDepartmentId !== user?.departmentId) {
            throw new common_1.ForbiddenException('You are not authorized to add opinion notes');
        }
        return this.prisma.opinionNote.create({
            data: {
                opinionRequestId,
                content,
                addedById: userId,
            },
            include: {
                addedBy: { select: { name: true } },
            },
        });
    }
    async provideOpinion(opinionRequestId, userId, data) {
        const opinionRequest = await this.prisma.opinionRequest.findUnique({
            where: { id: opinionRequestId },
            include: { file: true },
        });
        if (!opinionRequest) {
            throw new common_1.NotFoundException('Opinion request not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { departmentId: true },
        });
        if (opinionRequest.requestedToDepartmentId !== user?.departmentId) {
            throw new common_1.ForbiddenException('You are not authorized to provide this opinion');
        }
        const attachmentS3Keys = [];
        if (data.attachmentFiles && data.attachmentFiles.length > 0) {
            for (const file of data.attachmentFiles) {
                const s3Key = `opinions/${opinionRequestId}/${Date.now()}-${file.filename}`;
                await this.minio.uploadFile(s3Key, file.buffer, file.mimetype);
                attachmentS3Keys.push(s3Key);
            }
        }
        const updateData = {
            opinionNote: data.opinionNote,
            respondedById: userId,
            respondedAt: new Date(),
            status: 'responded',
        };
        if (attachmentS3Keys.length > 0) {
            updateData.opinionAttachments = attachmentS3Keys;
        }
        const updated = await this.prisma.opinionRequest.update({
            where: { id: opinionRequestId },
            data: updateData,
            include: {
                requestedBy: { select: { name: true } },
                file: { select: { fileNumber: true, subject: true } },
            },
        });
        await this.prisma.fileRouting.create({
            data: {
                fileId: opinionRequest.fileId,
                fromUserId: userId,
                action: client_1.FileAction.OPINION_PROVIDED,
                remarks: `Opinion provided by ${user.departmentId}`,
            },
        });
        await this.notifications.createNotification({
            userId: opinionRequest.requestedById,
            type: 'opinion_provided',
            title: 'Opinion Provided',
            message: `Opinion has been provided for file ${updated.file.fileNumber}`,
            fileId: opinionRequest.fileId,
            metadata: { opinionRequestId },
        });
        return updated;
    }
    async returnOpinion(opinionRequestId, userId) {
        const opinionRequest = await this.prisma.opinionRequest.findUnique({
            where: { id: opinionRequestId },
            include: { file: true },
        });
        if (!opinionRequest) {
            throw new common_1.NotFoundException('Opinion request not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { departmentId: true },
        });
        if (opinionRequest.requestedToDepartmentId !== user?.departmentId) {
            throw new common_1.ForbiddenException('You are not authorized to return this opinion');
        }
        const updated = await this.prisma.opinionRequest.update({
            where: { id: opinionRequestId },
            data: {
                status: 'returned',
                respondedById: userId,
                respondedAt: new Date(),
            },
        });
        await this.prisma.fileRouting.create({
            data: {
                fileId: opinionRequest.fileId,
                fromUserId: userId,
                action: client_1.FileAction.CONSULTATION_RETURNED,
                remarks: 'Opinion returned to requester',
            },
        });
        await this.notifications.createNotification({
            userId: opinionRequest.requestedById,
            type: 'opinion_returned',
            title: 'Opinion Returned',
            message: `Opinion has been returned for file ${opinionRequest.file.fileNumber}`,
            fileId: opinionRequest.fileId,
            metadata: { opinionRequestId },
        });
        return updated;
    }
};
exports.OpinionsService = OpinionsService;
exports.OpinionsService = OpinionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        minio_service_1.MinIOService])
], OpinionsService);
//# sourceMappingURL=opinions.service.js.map