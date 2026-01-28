import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { BackFilesService } from './backfiles.service';
export declare class BackFilesController {
    private backFilesService;
    constructor(backFilesService: BackFilesService);
    createBackFile(req: any, body: {
        fileNumber: string;
        subject: string;
        description?: string;
        departmentId: string;
        tags?: string;
    }, file?: Express.Multer.File): Promise<any>;
    getBackFiles(req: any, departmentId?: string, isHidden?: string, tagName?: string, search?: string): Promise<any>;
    getBackFileById(id: string, req: any): Promise<any>;
    getBackFilesForFile(fileId: string, req: any): Promise<any>;
    linkBackFile(req: any, body: {
        fileId: string;
        backFileId: string;
        linkReason?: string;
    }): Promise<any>;
    unlinkBackFile(body: {
        fileId: string;
        backFileId: string;
    }): Promise<{
        message: string;
    }>;
    updateAccess(id: string, req: any, body: {
        isHidden?: boolean;
        accessRoles?: string[];
    }): Promise<any>;
    addTag(backFileId: string, body: {
        tagName: string;
        tagValue?: string;
    }): Promise<any>;
    removeTag(tagId: string): Promise<any>;
    downloadBackFile(id: string, req: any, res: Response): Promise<StreamableFile>;
}
