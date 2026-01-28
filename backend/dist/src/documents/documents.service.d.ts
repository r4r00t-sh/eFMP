import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../minio/minio.service';
export declare class DocumentsService {
    private prisma;
    private minio;
    constructor(prisma: PrismaService, minio: MinIOService);
    uploadNewVersion(attachmentId: string, userId: string, file: {
        buffer: Buffer;
        filename: string;
        mimetype: string;
        size: number;
    }, changeDescription?: string): Promise<{
        attachment: any;
        newVersion: any;
        message: string;
    }>;
    getAttachmentVersions(attachmentId: string): Promise<any>;
    getVersionDownloadStream(versionId: string): Promise<{
        stream: NodeJS.ReadableStream;
        filename: any;
        mimeType: any;
        size: any;
    }>;
    restoreVersion(versionId: string, userId: string): Promise<{
        message: string;
    }>;
    compareVersions(versionId1: string, versionId2: string): Promise<{
        version1: {
            versionNumber: any;
            filename: any;
            size: any;
            mimeType: any;
            uploadedAt: any;
            changeDescription: any;
        };
        version2: {
            versionNumber: any;
            filename: any;
            size: any;
            mimeType: any;
            uploadedAt: any;
            changeDescription: any;
        };
        differences: {
            filenameChanged: boolean;
            sizeChange: number;
            mimeTypeChanged: boolean;
        };
    }>;
    generateFileQRCode(fileId: string, userId: string): Promise<{
        qrCode: any;
        imageUrl: string;
    }>;
    getQRCodeImage(qrCodeId: string): Promise<{
        stream: NodeJS.ReadableStream;
        mimeType: string;
    }>;
    scanQRCode(qrCodeData: string, userId: string, data: {
        location?: string;
        department?: string;
        division?: string;
        remarks?: string;
    }): Promise<{
        success: boolean;
        file: {
            id: any;
            fileNumber: any;
            subject: any;
            status: any;
            department: any;
            division: any;
            assignedTo: any;
        };
        message: string;
    }>;
    getFileScanHistory(fileId: string): Promise<{
        scans: never[];
        totalScans: number;
        qrCode?: undefined;
    } | {
        qrCode: {
            id: any;
            qrCodeData: any;
            scanCount: any;
            lastScannedAt: any;
        };
        scans: any;
        totalScans: any;
    }>;
    createTemplate(userId: string, data: {
        name: string;
        code: string;
        description?: string;
        category: string;
        defaultSubject?: string;
        defaultDescription?: string;
        defaultPriority?: string;
        defaultPriorityCategory?: string;
        defaultDueDays?: number;
        defaultDepartmentId?: string;
        defaultDivisionId?: string;
        isPublic?: boolean;
        departmentId?: string;
    }, templateFile?: {
        buffer: Buffer;
        filename: string;
        mimetype: string;
    }): Promise<any>;
    getTemplates(departmentId?: string, category?: string): Promise<any>;
    getTemplateById(id: string): Promise<any>;
    updateTemplate(id: string, userId: string, data: Partial<{
        name: string;
        description: string;
        category: string;
        defaultSubject: string;
        defaultDescription: string;
        defaultPriority: string;
        defaultPriorityCategory: string;
        defaultDueDays: number;
        isActive: boolean;
        isPublic: boolean;
    }>): Promise<any>;
    deleteTemplate(id: string): Promise<any>;
    getTemplateCategories(): Promise<any>;
    private calculateChecksum;
}
