import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { DispatchService } from './dispatch.service';
export declare class DispatchController {
    private dispatchService;
    constructor(dispatchService: DispatchService);
    prepareForDispatch(req: any, body: {
        fileId: string;
        remarks?: string;
    }): Promise<{
        message: string;
    }>;
    dispatchFile(req: any, body: {
        fileId: string;
        dispatchMethod: string;
        trackingNumber?: string;
        recipientName?: string;
        recipientAddress?: string;
        recipientEmail?: string;
        remarks?: string;
    }, proofDocument?: Express.Multer.File): Promise<{
        file: any;
        dispatchProof: any;
        message: string;
    }>;
    getDispatchProof(fileId: string): Promise<any>;
    getDispatchProofs(req: any, dateFrom?: string, dateTo?: string): Promise<any>;
    downloadDispatchDocument(dispatchProofId: string, documentType: 'proof' | 'acknowledgement', res: Response): Promise<StreamableFile>;
}
