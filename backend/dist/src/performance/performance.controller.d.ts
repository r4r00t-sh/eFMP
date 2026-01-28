import { PerformanceService } from './performance.service';
export declare class PerformanceController {
    private performanceService;
    constructor(performanceService: PerformanceService);
    getUserPerformance(userId: string, dateFrom?: string, dateTo?: string): Promise<{
        currentCoins: any;
        totalEarned: any;
        redListDeductions: any;
        workingHours: {
            total: any;
            average: number;
            records: any;
        };
        filesProcessed: any;
        badges: any;
        recentTransactions: any;
        redFlags: any;
    }>;
    getMyPerformance(req: any, dateFrom?: string, dateTo?: string): Promise<{
        currentCoins: any;
        totalEarned: any;
        redListDeductions: any;
        workingHours: {
            total: any;
            average: number;
            records: any;
        };
        filesProcessed: any;
        badges: any;
        recentTransactions: any;
        redFlags: any;
    }>;
    getDeskPerformance(deskId: string): Promise<{
        desk: any;
        currentFiles: any;
        badges: any;
        redFlags: any;
    }>;
    logWorkingHours(req: any, body: {
        date: string;
        hours: number;
    }): Promise<any>;
    calculateWorkingHours(req: any, body: {
        date?: string;
    }): Promise<{
        filesProcessed: any;
        filesCreated: any;
        estimatedHours: number;
    }>;
    getConfig(key: string): Promise<any>;
    setConfig(body: {
        key: string;
        value: any;
        description?: string;
    }): Promise<any>;
    resolveRedFlag(flagId: string, req: any, body: {
        resolutionNote?: string;
    }): Promise<any>;
}
