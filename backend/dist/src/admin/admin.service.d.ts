import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    private readonly HEARTBEAT_TIMEOUT;
    constructor(prisma: PrismaService);
    getDeskStatus(departmentId: string, userRole: string): Promise<any>;
    getDepartmentFiles(departmentId: string | null, userRole: string, filters: {
        status?: string;
        search?: string;
        isRedListed?: boolean;
        assignedToId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
    }>;
    getAnalytics(departmentId: string | null, userRole: string): Promise<{
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
    getDepartmentWiseAnalytics(): Promise<any>;
    getSettings(departmentId?: string): Promise<any>;
    updateSetting(key: string, value: string, userId: string, departmentId?: string): Promise<any>;
    getExtensionRequests(departmentId: string | null, userRole: string): Promise<any>;
    getRedListedFiles(departmentId: string | null, userRole: string): Promise<any>;
}
