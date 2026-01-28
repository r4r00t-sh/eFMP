import { FilesService } from './files.service';
export declare class FilesController {
    private filesService;
    constructor(filesService: FilesService);
    createFile(req: any, body: {
        subject: string;
        description?: string;
        departmentId: string;
        divisionId?: string;
        priority?: string;
        dueDate?: string;
    }, files?: Express.Multer.File[]): Promise<any>;
    getAllFiles(req: any, status?: string, search?: string, page?: string, limit?: string): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getFile(id: string, req: any): Promise<any>;
    addAttachments(id: string, req: any, files: Express.Multer.File[]): Promise<{
        attachments: any;
    }>;
    getAttachmentUrl(attachmentId: string): Promise<{
        url: string;
    }>;
    deleteAttachment(attachmentId: string, req: any): Promise<{
        message: string;
    }>;
    forwardFile(id: string, req: any, body: {
        toDivisionId: string;
        toUserId: string;
        remarks?: string;
    }): Promise<any>;
    performAction(id: string, req: any, body: {
        action: string;
        remarks?: string;
    }): Promise<any>;
    requestExtraTime(id: string, req: any, body: {
        additionalDays: number;
        reason?: string;
    }): Promise<{
        message: string;
        extensionRequest: any;
    }>;
    getExtensionRequests(id: string): Promise<any>;
    getPendingExtensionRequests(req: any): Promise<any>;
    approveExtension(requestId: string, req: any, body: {
        remarks?: string;
    }): Promise<{
        success: boolean;
        approved: boolean;
    }>;
    denyExtension(requestId: string, req: any, body: {
        remarks?: string;
    }): Promise<{
        success: boolean;
        approved: boolean;
    }>;
    recallFile(id: string, req: any, body: {
        remarks?: string;
    }): Promise<any>;
}
