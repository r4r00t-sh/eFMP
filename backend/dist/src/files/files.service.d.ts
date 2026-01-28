import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../minio/minio.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { TimingService } from '../timing/timing.service';
import { FilePriority } from '@prisma/client';
export declare class FilesService {
    private prisma;
    private minio;
    private rabbitmq;
    private timing;
    constructor(prisma: PrismaService, minio: MinIOService, rabbitmq: RabbitMQService, timing: TimingService);
    createFile(data: {
        subject: string;
        description?: string;
        departmentId: string;
        divisionId?: string;
        createdById: string;
        priority?: FilePriority;
        dueDate?: Date;
        files?: {
            buffer: Buffer;
            filename: string;
            mimetype: string;
            size: number;
        }[];
    }): Promise<any>;
    addAttachment(fileId: string, userId: string, uploadFile: {
        buffer: Buffer;
        filename: string;
        mimetype: string;
        size: number;
    }): Promise<any>;
    deleteAttachment(attachmentId: string, userId: string): Promise<{
        message: string;
    }>;
    getAttachmentUrl(attachmentId: string): Promise<string>;
    getAttachmentStream(attachmentId: string): Promise<{
        stream: NodeJS.ReadableStream;
        filename: string;
        mimeType: string;
    }>;
    getLegacyFileStream(s3Key: string): Promise<NodeJS.ReadableStream>;
    getAllFiles(userId: string, userRole: string, departmentId?: string | null, options?: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getFileById(id: string, userId: string): Promise<any>;
    forwardFile(fileId: string, fromUserId: string, toDivisionId: string, toUserId: string, remarks?: string): Promise<any>;
    performAction(fileId: string, userId: string, action: string, remarks?: string): Promise<any>;
    requestExtraTime(fileId: string, userId: string, additionalDays: number, reason?: string): Promise<{
        message: string;
        extensionRequest: any;
    }>;
    approveExtension(extensionReqId: string, userId: string, approved: boolean, remarks?: string): Promise<{
        success: boolean;
        approved: boolean;
    }>;
    getExtensionRequests(fileId: string): Promise<any>;
    getPendingExtensionRequests(userId: string): Promise<any>;
    recallFile(fileId: string, userId: string, userRole: string, remarks?: string): Promise<any>;
    private generateFileNumber;
    private createAuditLog;
}
