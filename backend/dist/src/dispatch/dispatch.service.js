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
exports.DispatchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const minio_service_1 = require("../minio/minio.service");
const client_1 = require("@prisma/client");
let DispatchService = class DispatchService {
    prisma;
    notifications;
    minio;
    constructor(prisma, notifications, minio) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.minio = minio;
    }
    async prepareForDispatch(fileId, userId, userRole, remarks) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        if (userRole !== client_1.UserRole.SUPER_ADMIN &&
            userRole !== client_1.UserRole.DEPT_ADMIN &&
            userRole !== client_1.UserRole.DISPATCHER) {
            throw new common_1.ForbiddenException('Only administrators or dispatchers can prepare files for dispatch');
        }
        await this.prisma.fileRouting.create({
            data: {
                fileId,
                fromUserId: userId,
                action: client_1.FileAction.DISPATCH_PREPARED,
                remarks: remarks || 'File prepared for dispatch',
            },
        });
        const dispatcher = await this.prisma.user.findFirst({
            where: {
                role: client_1.UserRole.DISPATCHER,
                departmentId: file.departmentId,
            },
        });
        if (dispatcher) {
            await this.notifications.createNotification({
                userId: dispatcher.id,
                type: 'file_ready_dispatch',
                title: 'File Ready for Dispatch',
                message: `File ${file.fileNumber} is ready for dispatch: ${file.subject}`,
                fileId: file.id,
            });
        }
        return { message: 'File marked as ready for dispatch' };
    }
    async dispatchFile(fileId, userId, data) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
            include: { department: true, createdBy: true },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (user?.role !== client_1.UserRole.DISPATCHER && user?.role !== client_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only dispatchers can dispatch files');
        }
        let proofS3Key;
        let acknowledgementS3Key;
        if (data.proofDocument) {
            proofS3Key = `dispatch/${fileId}/proof/${Date.now()}-${data.proofDocument.filename}`;
            await this.minio.uploadFile(proofS3Key, data.proofDocument.buffer, data.proofDocument.mimetype);
        }
        if (data.acknowledgementDocument) {
            acknowledgementS3Key = `dispatch/${fileId}/acknowledgement/${Date.now()}-${data.acknowledgementDocument.filename}`;
            await this.minio.uploadFile(acknowledgementS3Key, data.acknowledgementDocument.buffer, data.acknowledgementDocument.mimetype);
        }
        const dispatchProof = await this.prisma.dispatchProof.create({
            data: {
                fileId,
                dispatchedById: userId,
                dispatchMethod: data.dispatchMethod,
                trackingNumber: data.trackingNumber,
                recipientName: data.recipientName,
                recipientAddress: data.recipientAddress,
                recipientEmail: data.recipientEmail,
                proofDocumentS3Key: proofS3Key,
                acknowledgementS3Key: acknowledgementS3Key,
                remarks: data.remarks,
            },
        });
        const updatedFile = await this.prisma.file.update({
            where: { id: fileId },
            data: {
                status: client_1.FileStatus.APPROVED,
                isClosed: true,
                closedAt: new Date(),
                assignedToId: null,
            },
        });
        await this.prisma.fileRouting.create({
            data: {
                fileId,
                fromUserId: userId,
                action: client_1.FileAction.DISPATCHED,
                remarks: data.remarks || `File dispatched via ${data.dispatchMethod}`,
            },
        });
        const deptAdmin = await this.prisma.user.findFirst({
            where: {
                role: client_1.UserRole.DEPT_ADMIN,
                departmentId: file.departmentId,
            },
        });
        if (deptAdmin) {
            await this.notifications.createNotification({
                userId: deptAdmin.id,
                type: 'file_dispatched',
                title: 'File Dispatched',
                message: `File ${file.fileNumber} has been dispatched and closed`,
                fileId: file.id,
                metadata: { dispatchProofId: dispatchProof.id },
            });
        }
        await this.notifications.createNotification({
            userId: file.createdById,
            type: 'file_dispatched',
            title: 'File Dispatched',
            message: `Your file ${file.fileNumber} has been dispatched`,
            fileId: file.id,
        });
        return {
            file: updatedFile,
            dispatchProof,
            message: 'File dispatched successfully',
        };
    }
    async getDispatchProof(fileId) {
        return this.prisma.dispatchProof.findFirst({
            where: { fileId },
            include: {
                dispatchedBy: { select: { name: true, username: true } },
            },
            orderBy: { dispatchDate: 'desc' },
        });
    }
    async getDispatchProofs(departmentId, dateFrom, dateTo) {
        const where = {};
        if (departmentId) {
            where.file = { departmentId };
        }
        if (dateFrom || dateTo) {
            where.dispatchDate = {};
            if (dateFrom)
                where.dispatchDate.gte = dateFrom;
            if (dateTo)
                where.dispatchDate.lte = dateTo;
        }
        return this.prisma.dispatchProof.findMany({
            where,
            include: {
                file: {
                    select: {
                        id: true,
                        fileNumber: true,
                        subject: true,
                        department: { select: { name: true, code: true } },
                    },
                },
                dispatchedBy: { select: { name: true, username: true } },
            },
            orderBy: { dispatchDate: 'desc' },
        });
    }
    async getDispatchProofDocument(dispatchProofId, documentType) {
        const proof = await this.prisma.dispatchProof.findUnique({
            where: { id: dispatchProofId },
        });
        if (!proof) {
            throw new common_1.NotFoundException('Dispatch proof not found');
        }
        const s3Key = documentType === 'proof'
            ? proof.proofDocumentS3Key
            : proof.acknowledgementS3Key;
        if (!s3Key) {
            throw new common_1.NotFoundException(`${documentType} document not found`);
        }
        const stream = await this.minio.getFileStream(s3Key);
        const filename = s3Key.split('/').pop() || `dispatch-${documentType}.pdf`;
        return { stream, filename };
    }
};
exports.DispatchService = DispatchService;
exports.DispatchService = DispatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        minio_service_1.MinIOService])
], DispatchService);
//# sourceMappingURL=dispatch.service.js.map