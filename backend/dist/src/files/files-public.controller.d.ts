import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { FilesService } from './files.service';
export declare class FilesPublicController {
    private filesService;
    constructor(filesService: FilesService);
    downloadAttachment(attachmentId: string, res: Response): Promise<StreamableFile>;
    downloadLegacyFile(s3Key: string, res: Response): Promise<StreamableFile>;
}
