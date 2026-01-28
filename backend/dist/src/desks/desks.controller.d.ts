import { DesksService } from './desks.service';
export declare class DesksController {
    private desksService;
    constructor(desksService: DesksService);
    createDesk(req: any, body: {
        name: string;
        code: string;
        description?: string;
        departmentId: string;
        divisionId?: string;
        maxFilesPerDay?: number;
        iconType?: string;
    }): Promise<any>;
    getDesks(req: any, departmentId?: string, divisionId?: string): Promise<any>;
    getDeskById(id: string): Promise<any>;
    getDeskWorkloadSummary(req: any): Promise<{
        totalDesks: any;
        activeDesks: any;
        totalFiles: any;
        totalCapacity: any;
        overallUtilization: number;
        desks: any;
    }>;
    assignFileToDesk(req: any, body: {
        fileId: string;
        deskId: string;
    }): Promise<any>;
    updateDeskCapacity(id: string): Promise<any>;
    checkAndAutoCreateDesk(req: any, body: {
        divisionId?: string;
    }): Promise<any>;
    updateDesk(id: string, req: any, body: {
        name?: string;
        description?: string;
        maxFilesPerDay?: number;
        iconType?: string;
        isActive?: boolean;
    }): Promise<any>;
    deleteDesk(id: string, req: any): Promise<any>;
}
