import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    private checkAdminAccess;
    getDeskStatus(req: any): Promise<any>;
    getDepartmentFiles(req: any, status?: string, search?: string, isRedListed?: string, assignedToId?: string, page?: string, limit?: string): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getAnalytics(req: any): Promise<{
        summary: {
            totalFiles: any;
            pendingFiles: any;
            redListedFiles: any;
            completedFiles: any;
            extensionRequests: any;
            avgProcessingTimeHours: number | null;
        };
        scores: {
            highest: any;
            lowest: any;
            average: number;
            all: any;
        };
    }>;
    getDepartmentWiseAnalytics(req: any): Promise<any>;
    getRedListedFiles(req: any): Promise<any>;
    getExtensionRequests(req: any): Promise<any>;
    getSettings(req: any): Promise<any>;
    updateSetting(req: any, key: string, body: {
        value: string;
    }): Promise<any>;
}
