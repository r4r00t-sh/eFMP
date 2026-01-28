import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
export declare class DocumentsController {
    private documentsService;
    constructor(documentsService: DocumentsService);
    uploadNewVersion(attachmentId: string, req: any, file: Express.Multer.File, changeDescription?: string): Promise<{
        attachment: any;
        newVersion: any;
        message: string;
    }>;
    getAttachmentVersions(attachmentId: string): Promise<any>;
    downloadVersion(versionId: string, res: Response): Promise<StreamableFile>;
    restoreVersion(versionId: string, req: any): Promise<{
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
    generateQRCode(fileId: string, req: any): Promise<{
        qrCode: any;
        imageUrl: string;
    }>;
    getQRCodeImage(qrCodeId: string, res: Response): Promise<StreamableFile>;
    scanQRCode(req: any, body: {
        qrCodeData: string;
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
    createTemplate(req: any, body: {
        name: string;
        code: string;
        description?: string;
        category: string;
        defaultSubject?: string;
        defaultDescription?: string;
        defaultPriority?: string;
        defaultPriorityCategory?: string;
        defaultDueDays?: string;
        isPublic?: string;
    }, templateFile?: Express.Multer.File): Promise<any>;
    getTemplates(req: any, category?: string): Promise<any>;
    getTemplateById(id: string): Promise<any>;
    updateTemplate(id: string, req: any, body: {
        name?: string;
        description?: string;
        category?: string;
        defaultSubject?: string;
        defaultDescription?: string;
        defaultPriority?: string;
        defaultPriorityCategory?: string;
        defaultDueDays?: number;
        isActive?: boolean;
        isPublic?: boolean;
    }): Promise<any>;
    deleteTemplate(id: string): Promise<any>;
    getTemplateCategories(): Promise<any>;
}
