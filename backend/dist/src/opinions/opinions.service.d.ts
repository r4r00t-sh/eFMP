import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MinIOService } from '../minio/minio.service';
export declare class OpinionsService {
    private prisma;
    private notifications;
    private minio;
    constructor(prisma: PrismaService, notifications: NotificationsService, minio: MinIOService);
    requestOpinion(fileId: string, requestedById: string, data: {
        requestedToDepartmentId: string;
        requestedToDivisionId?: string;
        requestedToUserId?: string;
        requestReason?: string;
        specialPermissionGranted?: boolean;
    }): Promise<any>;
    getPendingOpinions(userId: string, departmentId?: string): Promise<any>;
    getFileForOpinion(opinionRequestId: string, userId: string): Promise<{
        opinionRequest: any;
        file: any;
    }>;
    addOpinionNote(opinionRequestId: string, userId: string, content: string): Promise<any>;
    provideOpinion(opinionRequestId: string, userId: string, data: {
        opinionNote: string;
        attachmentFiles?: Array<{
            buffer: Buffer;
            filename: string;
            mimetype: string;
            size: number;
        }>;
    }): Promise<any>;
    returnOpinion(opinionRequestId: string, userId: string): Promise<any>;
}
