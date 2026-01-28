import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../minio/minio.service';
import { UserRole } from '@prisma/client';
export declare class BackFilesService {
    private prisma;
    private minio;
    constructor(prisma: PrismaService, minio: MinIOService);
    createBackFile(userId: string, userRole: UserRole, data: {
        fileNumber: string;
        subject: string;
        description?: string;
        departmentId: string;
        file?: {
            buffer: Buffer;
            filename: string;
            mimetype: string;
            size: number;
        };
        tags?: Array<{
            name: string;
            value?: string;
        }>;
    }): Promise<any>;
    linkBackFileToFile(userId: string, fileId: string, backFileId: string, linkReason?: string): Promise<any>;
    getBackFilesForFile(fileId: string, userId: string, userRole: UserRole): Promise<any>;
    getBackFiles(userId: string, userRole: UserRole, filters?: {
        departmentId?: string;
        isHidden?: boolean;
        tagName?: string;
        search?: string;
    }): Promise<any>;
    getBackFileById(backFileId: string, userId: string, userRole: UserRole): Promise<any>;
    updateBackFileAccess(backFileId: string, userId: string, userRole: UserRole, data: {
        isHidden?: boolean;
        accessRoles?: string[];
    }): Promise<any>;
    addTag(backFileId: string, tagName: string, tagValue?: string): Promise<any>;
    removeTag(tagId: string): Promise<any>;
    unlinkBackFile(fileId: string, backFileId: string): Promise<{
        message: string;
    }>;
    downloadBackFile(backFileId: string, userId: string, userRole: UserRole): Promise<{
        stream: NodeJS.ReadableStream;
        filename: any;
        mimeType: string;
    }>;
}
