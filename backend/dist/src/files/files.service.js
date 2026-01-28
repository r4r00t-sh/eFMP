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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../minio/minio.service");
const rabbitmq_service_1 = require("../rabbitmq/rabbitmq.service");
const timing_service_1 = require("../timing/timing.service");
const client_1 = require("@prisma/client");
let FilesService = class FilesService {
    prisma;
    minio;
    rabbitmq;
    timing;
    constructor(prisma, minio, rabbitmq, timing) {
        this.prisma = prisma;
        this.minio = minio;
        this.rabbitmq = rabbitmq;
        this.timing = timing;
    }
    async createFile(data) {
        const fileNumber = await this.generateFileNumber(data.departmentId, data.divisionId);
        const file = await this.prisma.file.create({
            data: {
                fileNumber,
                subject: data.subject,
                description: data.description,
                departmentId: data.departmentId,
                currentDivisionId: data.divisionId,
                createdById: data.createdById,
                priority: data.priority || client_1.FilePriority.NORMAL,
                dueDate: data.dueDate,
                s3Bucket: this.minio.getBucketName(),
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true },
                },
                department: true,
            },
        });
        if (data.files && data.files.length > 0) {
            const attachments = await Promise.all(data.files.map(async (uploadFile) => {
                const s3Key = await this.minio.uploadFile(uploadFile.filename, uploadFile.buffer, uploadFile.mimetype);
                return {
                    fileId: file.id,
                    filename: uploadFile.filename,
                    s3Key,
                    s3Bucket: this.minio.getBucketName(),
                    mimeType: uploadFile.mimetype,
                    size: uploadFile.size,
                    uploadedById: data.createdById,
                };
            }));
            await this.prisma.attachment.createMany({
                data: attachments,
            });
            if (attachments.length > 0) {
                await this.prisma.file.update({
                    where: { id: file.id },
                    data: { s3Key: attachments[0].s3Key },
                });
            }
        }
        if (data.dueDate) {
            await this.timing.updateTimeRemaining(file.id);
        }
        await this.createAuditLog(file.id, data.createdById, 'created', 'File created');
        return file;
    }
    async addAttachment(fileId, userId, uploadFile) {
        const file = await this.prisma.file.findUnique({ where: { id: fileId } });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        const s3Key = await this.minio.uploadFile(uploadFile.filename, uploadFile.buffer, uploadFile.mimetype);
        const attachment = await this.prisma.attachment.create({
            data: {
                fileId,
                filename: uploadFile.filename,
                s3Key,
                s3Bucket: this.minio.getBucketName(),
                mimeType: uploadFile.mimetype,
                size: uploadFile.size,
                uploadedById: userId,
            },
        });
        await this.createAuditLog(fileId, userId, 'attachment_added', `Added attachment: ${uploadFile.filename}`);
        return attachment;
    }
    async deleteAttachment(attachmentId, userId) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id: attachmentId },
            include: { file: true },
        });
        if (!attachment) {
            throw new common_1.NotFoundException('Attachment not found');
        }
        await this.minio.deleteFile(attachment.s3Key);
        await this.prisma.attachment.delete({ where: { id: attachmentId } });
        await this.createAuditLog(attachment.fileId, userId, 'attachment_deleted', `Deleted attachment: ${attachment.filename}`);
        return { message: 'Attachment deleted' };
    }
    async getAttachmentUrl(attachmentId) {
        const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
        if (!attachment) {
            throw new common_1.NotFoundException('Attachment not found');
        }
        return this.minio.getFileUrl(attachment.s3Key, 3600);
    }
    async getAttachmentStream(attachmentId) {
        const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
        if (!attachment) {
            throw new common_1.NotFoundException('Attachment not found');
        }
        const stream = await this.minio.getFileStream(attachment.s3Key);
        return {
            stream,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
        };
    }
    async getLegacyFileStream(s3Key) {
        if (!s3Key) {
            throw new common_1.NotFoundException('File key not provided');
        }
        return this.minio.getFileStream(s3Key);
    }
    async getAllFiles(userId, userRole, departmentId, options) {
        const where = {};
        const page = options?.page || 1;
        const limit = options?.limit || 50;
        const skip = (page - 1) * limit;
        if (userRole === 'SUPER_ADMIN') {
        }
        else if (userRole === 'DEPT_ADMIN') {
            if (departmentId) {
                where.departmentId = departmentId;
            }
        }
        else if (userRole === 'APPROVAL_AUTHORITY') {
            if (departmentId) {
                where.departmentId = departmentId;
            }
        }
        else if (userRole === 'INWARD_DESK' || userRole === 'DISPATCHER') {
            if (departmentId) {
                where.departmentId = departmentId;
            }
        }
        else if (userRole === 'SECTION_OFFICER') {
            where.OR = [
                { assignedToId: userId },
                { createdById: userId },
            ];
        }
        else {
            where.OR = [
                { assignedToId: userId },
                { createdById: userId },
            ];
        }
        if (options?.status) {
            where.status = options.status;
        }
        if (options?.search) {
            const searchCondition = {
                OR: [
                    { fileNumber: { contains: options.search, mode: 'insensitive' } },
                    { subject: { contains: options.search, mode: 'insensitive' } },
                    { description: { contains: options.search, mode: 'insensitive' } },
                ],
            };
            if (where.OR) {
                const existingOr = where.OR;
                delete where.OR;
                where.AND = [
                    { OR: existingOr },
                    searchCondition,
                ];
            }
            else {
                where.OR = searchCondition.OR;
            }
        }
        const [files, total] = await Promise.all([
            this.prisma.file.findMany({
                where,
                include: {
                    createdBy: { select: { id: true, name: true, username: true } },
                    assignedTo: { select: { id: true, name: true, username: true } },
                    department: { select: { id: true, name: true, code: true } },
                    currentDivision: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
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
    async getFileById(id, userId) {
        const file = await this.prisma.file.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
                department: true,
                currentDivision: true,
                notes: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                routingHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                attachments: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        let fileUrl = null;
        if (file.s3Key) {
            fileUrl = await this.minio.getFileUrl(file.s3Key, 3600);
        }
        const attachmentsWithUrls = file.attachments.map((att) => ({
            ...att,
            url: `/files/attachments/${att.id}/download`,
        }));
        return {
            ...file,
            fileUrl: file.s3Key ? `/files/attachments/legacy/download?key=${encodeURIComponent(file.s3Key)}` : null,
            attachments: attachmentsWithUrls,
        };
    }
    async forwardFile(fileId, fromUserId, toDivisionId, toUserId, remarks) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
            include: { assignedTo: true },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        const updatedFile = await this.prisma.file.update({
            where: { id: fileId },
            data: {
                assignedToId: toUserId,
                currentDivisionId: toDivisionId,
                status: client_1.FileStatus.IN_PROGRESS,
            },
        });
        await this.prisma.fileRouting.create({
            data: {
                fileId,
                fromUserId,
                toUserId,
                toDivisionId,
                action: client_1.FileAction.FORWARDED,
                actionString: 'forward',
                remarks,
            },
        });
        await this.createAuditLog(fileId, fromUserId, 'forward', remarks || 'File forwarded');
        if (toUserId) {
            await this.rabbitmq.publishToast({
                userId: toUserId,
                type: 'file_received',
                title: 'New File Assigned',
                message: `File ${file.fileNumber}: ${file.subject}`,
                fileId: file.id,
                actions: [
                    { label: 'Request Extra Time', action: 'request_extra_time', payload: { fileId } },
                ],
            });
        }
        return updatedFile;
    }
    async performAction(fileId, userId, action, remarks) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        let newStatus;
        let fileAction;
        switch (action) {
            case 'approve':
                newStatus = client_1.FileStatus.APPROVED;
                fileAction = client_1.FileAction.APPROVED;
                break;
            case 'reject':
                newStatus = client_1.FileStatus.REJECTED;
                fileAction = client_1.FileAction.REJECTED;
                break;
            case 'return':
            case 'return_to_previous':
                newStatus = client_1.FileStatus.RETURNED;
                fileAction = client_1.FileAction.RETURNED_TO_PREVIOUS;
                break;
            case 'return_to_host':
                newStatus = client_1.FileStatus.RETURNED;
                fileAction = client_1.FileAction.RETURNED_TO_HOST;
                break;
            case 'hold':
                newStatus = client_1.FileStatus.ON_HOLD;
                fileAction = client_1.FileAction.ON_HOLD;
                break;
            case 'release':
                newStatus = client_1.FileStatus.IN_PROGRESS;
                fileAction = client_1.FileAction.RELEASED_FROM_HOLD;
                break;
            default:
                throw new common_1.ForbiddenException('Invalid action');
        }
        const updatedFile = await this.prisma.file.update({
            where: { id: fileId },
            data: {
                status: newStatus,
                isOnHold: action === 'hold',
                holdReason: action === 'hold' ? remarks : null,
            },
        });
        await this.prisma.fileRouting.create({
            data: {
                fileId,
                fromUserId: userId,
                action: fileAction,
                actionString: action,
                remarks,
            },
        });
        await this.createAuditLog(fileId, userId, action, remarks || `File ${action}`);
        return updatedFile;
    }
    async requestExtraTime(fileId, userId, additionalDays, reason) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
            include: {
                createdBy: true,
                department: true,
                routingHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    where: { toUserId: userId },
                },
            },
        });
        if (!file || file.assignedToId !== userId) {
            throw new common_1.ForbiddenException('You are not assigned to this file');
        }
        const requester = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });
        const lastRouting = file.routingHistory[0];
        const approverId = lastRouting?.fromUserId || file.createdById;
        const approver = await this.prisma.user.findUnique({
            where: { id: approverId },
            select: { name: true },
        });
        const additionalTimeSeconds = additionalDays * 24 * 60 * 60;
        const extensionRequest = await this.prisma.timeExtensionRequest.create({
            data: {
                fileId,
                requestedById: userId,
                requestedByName: requester?.name,
                reason: reason || 'Extra time needed',
                additionalTime: additionalTimeSeconds,
                approverId,
                approverName: approver?.name,
                status: 'pending',
            },
        });
        await this.rabbitmq.publishToast({
            userId: approverId,
            type: 'extension_request',
            title: 'Extra Time Request',
            message: `${requester?.name || 'User'} requested ${additionalDays} additional days for file ${file.fileNumber}`,
            fileId: file.id,
            extensionReqId: extensionRequest.id,
            actions: [
                { label: 'Approve', action: 'approve_extension', payload: { extensionReqId: extensionRequest.id } },
                { label: 'Deny', action: 'deny_extension', payload: { extensionReqId: extensionRequest.id } },
            ],
        });
        await this.createAuditLog(fileId, userId, 'request_extra_time', `Requested ${additionalDays} additional days`);
        const admins = await this.prisma.user.findMany({
            where: {
                OR: [
                    { role: 'SUPER_ADMIN' },
                    { role: 'DEPT_ADMIN', departmentId: file.departmentId },
                ],
                isActive: true,
            },
            select: { id: true },
        });
        for (const admin of admins) {
            await this.rabbitmq.publishToast({
                userId: admin.id,
                type: 'admin_extension_requested',
                title: 'Extension Requested',
                message: `${requester?.name || 'User'} requested extra time for file ${file.fileNumber}`,
                fileId: file.id,
            });
        }
        return { message: 'Extension request sent', extensionRequest };
    }
    async approveExtension(extensionReqId, userId, approved, remarks) {
        const request = await this.prisma.timeExtensionRequest.findUnique({
            where: { id: extensionReqId },
            include: {
                file: {
                    include: { department: true },
                },
            },
        });
        if (!request) {
            throw new common_1.NotFoundException('Extension request not found');
        }
        if (request.approverId !== userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user || !['SUPER_ADMIN', 'DEPT_ADMIN'].includes(user.role)) {
                throw new common_1.ForbiddenException('You are not authorized to approve this request');
            }
        }
        const approver = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });
        await this.prisma.timeExtensionRequest.update({
            where: { id: extensionReqId },
            data: {
                isApproved: approved,
                approvedAt: new Date(),
                approvedById: userId,
                approvalRemarks: remarks,
                status: approved ? 'approved' : 'denied',
            },
        });
        if (approved) {
            const additionalSeconds = request.additionalTime;
            const file = request.file;
            const newDueDate = file.dueDate
                ? new Date(file.dueDate.getTime() + additionalSeconds * 1000)
                : new Date(Date.now() + additionalSeconds * 1000);
            const newDeskDueDate = file.deskDueDate
                ? new Date(file.deskDueDate.getTime() + additionalSeconds * 1000)
                : null;
            await this.prisma.file.update({
                where: { id: file.id },
                data: {
                    dueDate: newDueDate,
                    deskDueDate: newDeskDueDate,
                    allottedTime: (file.allottedTime || 0) + additionalSeconds,
                },
            });
            await this.timing.updateTimeRemaining(file.id);
        }
        await this.rabbitmq.publishToast({
            userId: request.requestedById,
            type: approved ? 'extension_approved' : 'extension_denied',
            title: approved ? 'Extra Time Approved' : 'Extra Time Denied',
            message: approved
                ? `Your extra time request for file ${request.file.fileNumber} was approved by ${approver?.name || 'Admin'}`
                : `Your extra time request for file ${request.file.fileNumber} was denied${remarks ? `: ${remarks}` : ''}`,
            fileId: request.fileId,
        });
        const admins = await this.prisma.user.findMany({
            where: {
                OR: [
                    { role: 'SUPER_ADMIN' },
                    { role: 'DEPT_ADMIN', departmentId: request.file.departmentId },
                ],
                isActive: true,
                id: { not: userId },
            },
            select: { id: true },
        });
        for (const admin of admins) {
            await this.rabbitmq.publishToast({
                userId: admin.id,
                type: `admin_extension_${approved ? 'approved' : 'denied'}`,
                title: `Extension ${approved ? 'Approved' : 'Denied'}`,
                message: `${approver?.name || 'Admin'} ${approved ? 'approved' : 'denied'} extra time for file ${request.file.fileNumber}`,
                fileId: request.fileId,
            });
        }
        await this.createAuditLog(request.fileId, userId, approved ? 'approve_extra_time' : 'deny_extra_time', remarks || `Extension ${approved ? 'approved' : 'denied'}`);
        return { success: true, approved };
    }
    async getExtensionRequests(fileId) {
        return this.prisma.timeExtensionRequest.findMany({
            where: { fileId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPendingExtensionRequests(userId) {
        return this.prisma.timeExtensionRequest.findMany({
            where: {
                approverId: userId,
                status: 'pending',
            },
            include: {
                file: {
                    select: { id: true, fileNumber: true, subject: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async recallFile(fileId, userId, userRole, remarks) {
        if (userRole !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Only Super Admin can recall files');
        }
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        const updatedFile = await this.prisma.file.update({
            where: { id: fileId },
            data: {
                status: client_1.FileStatus.RECALLED,
                assignedToId: null,
            },
        });
        await this.prisma.fileRouting.create({
            data: {
                fileId,
                fromUserId: userId,
                action: client_1.FileAction.RECALLED,
                actionString: 'recall',
                remarks: remarks || 'File recalled by Super Admin',
            },
        });
        await this.createAuditLog(fileId, userId, 'recall', remarks || 'File recalled');
        return updatedFile;
    }
    async generateFileNumber(departmentId, divisionId) {
        const department = await this.prisma.department.findUnique({
            where: { id: departmentId },
        });
        if (!department) {
            throw new common_1.NotFoundException('Department not found');
        }
        let divisionCode = 'GEN';
        if (divisionId) {
            const division = await this.prisma.division.findUnique({
                where: { id: divisionId },
            });
            if (division) {
                divisionCode = division.code;
            }
        }
        const year = new Date().getFullYear();
        const count = await this.prisma.file.count({
            where: {
                departmentId,
                createdAt: {
                    gte: new Date(`${year}-01-01`),
                },
            },
        });
        return `${department.code}-${divisionCode}-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async createAuditLog(fileId, userId, action, remarks) {
        await this.prisma.auditLog.create({
            data: {
                action,
                entityType: 'File',
                entityId: fileId,
                userId,
                fileId,
                metadata: { remarks },
            },
        });
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinIOService,
        rabbitmq_service_1.RabbitMQService,
        timing_service_1.TimingService])
], FilesService);
//# sourceMappingURL=files.service.js.map