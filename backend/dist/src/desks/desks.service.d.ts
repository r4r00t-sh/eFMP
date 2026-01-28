import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
export declare class DesksService {
    private prisma;
    constructor(prisma: PrismaService);
    createDesk(userId: string, userRole: UserRole, data: {
        name: string;
        code: string;
        description?: string;
        departmentId: string;
        divisionId?: string;
        maxFilesPerDay?: number;
        iconType?: string;
    }): Promise<any>;
    getDesks(departmentId?: string, divisionId?: string): Promise<any>;
    getDeskById(deskId: string): Promise<any>;
    assignFileToDesk(fileId: string, deskId: string, userId: string, userRole: UserRole): Promise<any>;
    updateDeskCapacity(deskId: string): Promise<any>;
    autoCreateDesk(departmentId: string, divisionId?: string): Promise<any>;
    checkAndAutoCreateDesk(departmentId: string, divisionId?: string): Promise<any>;
    getDeskWorkloadSummary(departmentId?: string): Promise<{
        totalDesks: any;
        activeDesks: any;
        totalFiles: any;
        totalCapacity: any;
        overallUtilization: number;
        desks: any;
    }>;
    updateDesk(deskId: string, userId: string, userRole: UserRole, data: {
        name?: string;
        description?: string;
        maxFilesPerDay?: number;
        iconType?: string;
        isActive?: boolean;
    }): Promise<any>;
    deleteDesk(deskId: string, userId: string, userRole: UserRole): Promise<any>;
}
