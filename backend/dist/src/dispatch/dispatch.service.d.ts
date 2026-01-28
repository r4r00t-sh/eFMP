import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MinIOService } from '../minio/minio.service';
import { UserRole } from '@prisma/client';
export declare class DispatchService {
    private prisma;
    private notifications;
    private minio;
    constructor(prisma: PrismaService, notifications: NotificationsService, minio: MinIOService);
    prepareForDispatch(fileId: string, userId: string, userRole: UserRole, remarks?: string): Promise<{
        message: string;
    }>;
    dispatchFile(fileId: string, userId: string, data: {
        dispatchMethod: string;
        trackingNumber?: string;
        recipientName?: string;
        recipientAddress?: string;
        recipientEmail?: string;
        remarks?: string;
        proofDocument?: {
            buffer: Buffer;
            filename: string;
            mimetype: string;
            size: number;
        };
        acknowledgementDocument?: {
            buffer: Buffer;
            filename: string;
            mimetype: string;
            size: number;
        };
    }): Promise<{
        file: any;
        dispatchProof: any;
        message: string;
    }>;
    getDispatchProof(fileId: string): Promise<any>;
    getDispatchProofs(departmentId?: string, dateFrom?: Date, dateTo?: Date): Promise<any>;
    getDispatchProofDocument(dispatchProofId: string, documentType: 'proof' | 'acknowledgement'): Promise<{
        stream: NodeJS.ReadableStream;
        filename: any;
    }>;
}
