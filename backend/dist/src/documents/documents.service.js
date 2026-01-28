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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../minio/minio.service");
const crypto = __importStar(require("crypto"));
const QRCode = __importStar(require("qrcode"));
let DocumentsService = class DocumentsService {
    prisma;
    minio;
    constructor(prisma, minio) {
        this.prisma = prisma;
        this.minio = minio;
    }
    async uploadNewVersion(attachmentId, userId, file, changeDescription) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id: attachmentId },
            include: { file: true },
        });
        if (!attachment) {
            throw new common_1.NotFoundException('Attachment not found');
        }
        if (attachment.file.assignedToId !== userId && attachment.file.createdById !== userId) {
            throw new common_1.ForbiddenException('You are not authorized to upload new versions');
        }
        const latestVersion = await this.prisma.attachmentVersion.findFirst({
            where: { originalAttachmentId: attachmentId },
            orderBy: { versionNumber: 'desc' },
        });
        const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 2;
        if (!latestVersion) {
            await this.prisma.attachmentVersion.create({
                data: {
                    attachmentId: attachment.id,
                    originalAttachmentId: attachment.id,
                    versionNumber: 1,
                    filename: attachment.filename,
                    s3Key: attachment.s3Key,
                    s3Bucket: attachment.s3Bucket,
                    mimeType: attachment.mimeType,
                    size: attachment.size,
                    uploadedById: attachment.uploadedById || userId,
                    changeDescription: 'Original version',
                    isLatest: false,
                    checksum: await this.calculateChecksum(attachment.s3Key, attachment.s3Bucket),
                },
            });
        }
        else {
            await this.prisma.attachmentVersion.updateMany({
                where: { originalAttachmentId: attachmentId, isLatest: true },
                data: { isLatest: false },
            });
        }
        const s3Key = `files/${attachment.fileId}/attachments/${Date.now()}-${file.filename}`;
        await this.minio.uploadFile(s3Key, file.buffer, file.mimetype);
        const checksum = crypto.createHash('md5').update(file.buffer).digest('hex');
        const newVersion = await this.prisma.attachmentVersion.create({
            data: {
                attachmentId: attachment.id,
                originalAttachmentId: attachmentId,
                versionNumber: newVersionNumber,
                filename: file.filename,
                s3Key,
                s3Bucket: 'efiling',
                mimeType: file.mimetype,
                size: file.size,
                uploadedById: userId,
                changeDescription,
                isLatest: true,
                checksum,
            },
        });
        await this.prisma.attachment.update({
            where: { id: attachmentId },
            data: {
                filename: file.filename,
                s3Key,
                mimeType: file.mimetype,
                size: file.size,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                action: 'ATTACHMENT_VERSION_UPLOADED',
                entityType: 'Attachment',
                entityId: attachmentId,
                userId,
                fileId: attachment.fileId,
                metadata: {
                    versionNumber: newVersionNumber,
                    filename: file.filename,
                    changeDescription,
                },
            },
        });
        return {
            attachment,
            newVersion,
            message: `Version ${newVersionNumber} uploaded successfully`,
        };
    }
    async getAttachmentVersions(attachmentId) {
        const versions = await this.prisma.attachmentVersion.findMany({
            where: { originalAttachmentId: attachmentId },
            orderBy: { versionNumber: 'desc' },
        });
        return versions.map(v => ({
            ...v,
            downloadUrl: `/documents/versions/${v.id}/download`,
        }));
    }
    async getVersionDownloadStream(versionId) {
        const version = await this.prisma.attachmentVersion.findUnique({
            where: { id: versionId },
        });
        if (!version) {
            throw new common_1.NotFoundException('Version not found');
        }
        const stream = await this.minio.getFileStream(version.s3Key);
        return {
            stream,
            filename: version.filename,
            mimeType: version.mimeType,
            size: version.size,
        };
    }
    async restoreVersion(versionId, userId) {
        const version = await this.prisma.attachmentVersion.findUnique({
            where: { id: versionId },
        });
        if (!version) {
            throw new common_1.NotFoundException('Version not found');
        }
        const attachment = await this.prisma.attachment.findUnique({
            where: { id: version.attachmentId },
            include: { file: true },
        });
        if (!attachment) {
            throw new common_1.NotFoundException('Attachment not found');
        }
        if (attachment.file.assignedToId !== userId && attachment.file.createdById !== userId) {
            throw new common_1.ForbiddenException('You are not authorized to restore versions');
        }
        await this.prisma.attachmentVersion.updateMany({
            where: { originalAttachmentId: version.originalAttachmentId },
            data: { isLatest: false },
        });
        await this.prisma.attachmentVersion.update({
            where: { id: versionId },
            data: { isLatest: true },
        });
        await this.prisma.attachment.update({
            where: { id: version.attachmentId },
            data: {
                filename: version.filename,
                s3Key: version.s3Key,
                mimeType: version.mimeType,
                size: version.size,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                action: 'ATTACHMENT_VERSION_RESTORED',
                entityType: 'Attachment',
                entityId: version.attachmentId,
                userId,
                fileId: attachment.fileId,
                metadata: {
                    restoredVersionNumber: version.versionNumber,
                },
            },
        });
        return { message: `Restored to version ${version.versionNumber}` };
    }
    async compareVersions(versionId1, versionId2) {
        const [v1, v2] = await Promise.all([
            this.prisma.attachmentVersion.findUnique({ where: { id: versionId1 } }),
            this.prisma.attachmentVersion.findUnique({ where: { id: versionId2 } }),
        ]);
        if (!v1 || !v2) {
            throw new common_1.NotFoundException('One or both versions not found');
        }
        return {
            version1: {
                versionNumber: v1.versionNumber,
                filename: v1.filename,
                size: v1.size,
                mimeType: v1.mimeType,
                uploadedAt: v1.createdAt,
                changeDescription: v1.changeDescription,
            },
            version2: {
                versionNumber: v2.versionNumber,
                filename: v2.filename,
                size: v2.size,
                mimeType: v2.mimeType,
                uploadedAt: v2.createdAt,
                changeDescription: v2.changeDescription,
            },
            differences: {
                filenameChanged: v1.filename !== v2.filename,
                sizeChange: v2.size - v1.size,
                mimeTypeChanged: v1.mimeType !== v2.mimeType,
            },
        };
    }
    async generateFileQRCode(fileId, userId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        let qrCode = await this.prisma.fileQRCode.findUnique({
            where: { fileId },
        });
        if (qrCode) {
            return {
                qrCode,
                imageUrl: `/documents/qr/${qrCode.id}/image`,
            };
        }
        const qrCodeData = `EFILING-${file.fileNumber}-${Date.now()}`;
        const qrImageBuffer = await QRCode.toBuffer(qrCodeData, {
            type: 'png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'H',
        });
        const qrImageKey = `qrcodes/${fileId}-qr.png`;
        await this.minio.uploadFile(qrImageKey, qrImageBuffer, 'image/png');
        qrCode = await this.prisma.fileQRCode.create({
            data: {
                fileId,
                qrCodeData,
                qrCodeImageKey: qrImageKey,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                action: 'QR_CODE_GENERATED',
                entityType: 'File',
                entityId: fileId,
                userId,
                fileId,
                metadata: { qrCodeData },
            },
        });
        return {
            qrCode,
            imageUrl: `/documents/qr/${qrCode.id}/image`,
        };
    }
    async getQRCodeImage(qrCodeId) {
        const qrCode = await this.prisma.fileQRCode.findUnique({
            where: { id: qrCodeId },
        });
        if (!qrCode || !qrCode.qrCodeImageKey) {
            throw new common_1.NotFoundException('QR code not found');
        }
        const stream = await this.minio.getFileStream(qrCode.qrCodeImageKey);
        return { stream, mimeType: 'image/png' };
    }
    async scanQRCode(qrCodeData, userId, data) {
        const qrCode = await this.prisma.fileQRCode.findFirst({
            where: { qrCodeData },
        });
        if (!qrCode) {
            throw new common_1.NotFoundException('QR code not recognized');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });
        await this.prisma.qRCodeScanLog.create({
            data: {
                qrCodeData,
                fileId: qrCode.fileId,
                scannedById: userId,
                scannedByName: user?.name,
                location: data.location,
                department: data.department,
                division: data.division,
                remarks: data.remarks,
            },
        });
        await this.prisma.fileQRCode.update({
            where: { id: qrCode.id },
            data: {
                lastScannedAt: new Date(),
                lastScannedById: userId,
                scanCount: { increment: 1 },
            },
        });
        const file = await this.prisma.file.findUnique({
            where: { id: qrCode.fileId },
            include: {
                department: { select: { name: true } },
                currentDivision: { select: { name: true } },
                assignedTo: { select: { name: true } },
            },
        });
        return {
            success: true,
            file: {
                id: file?.id,
                fileNumber: file?.fileNumber,
                subject: file?.subject,
                status: file?.status,
                department: file?.department.name,
                division: file?.currentDivision?.name,
                assignedTo: file?.assignedTo?.name,
            },
            message: 'QR code scanned successfully',
        };
    }
    async getFileScanHistory(fileId) {
        const qrCode = await this.prisma.fileQRCode.findUnique({
            where: { fileId },
        });
        if (!qrCode) {
            return { scans: [], totalScans: 0 };
        }
        const scans = await this.prisma.qRCodeScanLog.findMany({
            where: { fileId },
            orderBy: { createdAt: 'desc' },
        });
        return {
            qrCode: {
                id: qrCode.id,
                qrCodeData: qrCode.qrCodeData,
                scanCount: qrCode.scanCount,
                lastScannedAt: qrCode.lastScannedAt,
            },
            scans,
            totalScans: scans.length,
        };
    }
    async createTemplate(userId, data, templateFile) {
        let templateS3Key;
        if (templateFile) {
            templateS3Key = `templates/${data.code}/${templateFile.filename}`;
            await this.minio.uploadFile(templateS3Key, templateFile.buffer, templateFile.mimetype);
        }
        const template = await this.prisma.fileTemplate.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                category: data.category,
                defaultSubject: data.defaultSubject,
                defaultDescription: data.defaultDescription,
                defaultPriority: data.defaultPriority || 'NORMAL',
                defaultPriorityCategory: data.defaultPriorityCategory || 'ROUTINE',
                defaultDueDays: data.defaultDueDays,
                defaultDepartmentId: data.defaultDepartmentId,
                defaultDivisionId: data.defaultDivisionId,
                templateS3Key,
                templateS3Bucket: templateS3Key ? 'efiling' : undefined,
                templateFilename: templateFile?.filename,
                templateMimeType: templateFile?.mimetype,
                isPublic: data.isPublic ?? true,
                departmentId: data.departmentId,
                createdById: userId,
            },
        });
        return template;
    }
    async getTemplates(departmentId, category) {
        const where = { isActive: true };
        if (departmentId) {
            where.OR = [
                { isPublic: true },
                { departmentId },
            ];
        }
        else {
            where.isPublic = true;
        }
        if (category) {
            where.category = category;
        }
        return this.prisma.fileTemplate.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }
    async getTemplateById(id) {
        const template = await this.prisma.fileTemplate.findUnique({
            where: { id },
        });
        if (!template) {
            throw new common_1.NotFoundException('Template not found');
        }
        return template;
    }
    async updateTemplate(id, userId, data) {
        return this.prisma.fileTemplate.update({
            where: { id },
            data: {
                ...data,
                defaultPriority: data.defaultPriority,
                defaultPriorityCategory: data.defaultPriorityCategory,
            },
        });
    }
    async deleteTemplate(id) {
        return this.prisma.fileTemplate.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async getTemplateCategories() {
        const categories = await this.prisma.fileTemplate.groupBy({
            by: ['category'],
            where: { isActive: true },
            _count: { id: true },
        });
        return categories.map(c => ({
            category: c.category,
            count: c._count.id,
        }));
    }
    async calculateChecksum(s3Key, bucket) {
        try {
            const stream = await this.minio.getFileStream(s3Key);
            return new Promise((resolve, reject) => {
                const hash = crypto.createHash('md5');
                stream.on('data', (data) => hash.update(data));
                stream.on('end', () => resolve(hash.digest('hex')));
                stream.on('error', reject);
            });
        }
        catch {
            return null;
        }
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinIOService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map