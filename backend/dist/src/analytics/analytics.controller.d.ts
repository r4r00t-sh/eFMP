import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardAnalytics(req: any, dateFrom?: string, dateTo?: string): Promise<{
        summary: {
            totalFiles: any;
            pendingFiles: any;
            inProgressFiles: any;
            completedFiles: any;
            rejectedFiles: any;
            redListedFiles: any;
            onHoldFiles: any;
            totalUsers: any;
            activeUsersToday: any;
            avgProcessingTimeHours: number | null;
            completionRate: number;
            redListRate: number;
        };
        filesByPriority: any;
        filesByPriorityCategory: any;
        filesPerDay: any[];
        extensionStats: any;
    }>;
    getDepartmentAnalytics(): Promise<any>;
    getUserPerformanceAnalytics(req: any, limit?: string): Promise<any>;
    getProcessingTimeAnalytics(req: any): Promise<{
        byPriorityCategory: any;
        byDepartment: any;
    }>;
    getBottleneckAnalysis(req: any): Promise<{
        userBottlenecks: any;
        divisionBottlenecks: any;
        overdueFiles: any;
    }>;
    generateReport(req: any, type: 'summary' | 'detailed' | 'user_performance' | 'department', dateFrom?: string, dateTo?: string): Promise<{
        summary: {
            totalFiles: any;
            pendingFiles: any;
            inProgressFiles: any;
            completedFiles: any;
            rejectedFiles: any;
            redListedFiles: any;
            onHoldFiles: any;
            totalUsers: any;
            activeUsersToday: any;
            avgProcessingTimeHours: number | null;
            completionRate: number;
            redListRate: number;
        };
        filesByPriority: any;
        filesByPriorityCategory: any;
        filesPerDay: any[];
        extensionStats: any;
    } | {
        generatedAt: Date;
        totalRecords: any;
        files: any;
        users?: undefined;
        departments?: undefined;
    } | {
        generatedAt: Date;
        users: any;
        totalRecords?: undefined;
        files?: undefined;
        departments?: undefined;
    } | {
        generatedAt: Date;
        departments: any;
        totalRecords?: undefined;
        files?: undefined;
        users?: undefined;
    }>;
    exportReportCSV(req: any, res: Response, type: 'summary' | 'detailed' | 'user_performance' | 'department', dateFrom?: string, dateTo?: string): Promise<void>;
    private convertToCSV;
    private convertSummaryToCSV;
}
