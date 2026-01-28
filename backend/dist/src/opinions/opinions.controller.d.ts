import { OpinionsService } from './opinions.service';
export declare class OpinionsController {
    private opinionsService;
    constructor(opinionsService: OpinionsService);
    requestOpinion(req: any, body: {
        fileId: string;
        requestedToDepartmentId: string;
        requestedToDivisionId?: string;
        requestedToUserId?: string;
        requestReason?: string;
        specialPermissionGranted?: boolean;
    }): Promise<any>;
    getPendingOpinions(req: any): Promise<any>;
    getFileForOpinion(opinionRequestId: string, req: any): Promise<{
        opinionRequest: any;
        file: any;
    }>;
    addOpinionNote(opinionRequestId: string, req: any, body: {
        content: string;
    }): Promise<any>;
    provideOpinion(opinionRequestId: string, req: any, body: {
        opinionNote: string;
    }, files?: Express.Multer.File[]): Promise<any>;
    returnOpinion(opinionRequestId: string, req: any): Promise<any>;
}
