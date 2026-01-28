import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardAnalytics(departmentId?: string, dateFrom?: Date, dateTo?: Date): Promise<{
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
    getUserPerformanceAnalytics(departmentId?: string, limit?: number): Promise<any>;
    getProcessingTimeAnalytics(departmentId?: string): Promise<{
        byPriorityCategory: any;
        byDepartment: any;
    }>;
    getBottleneckAnalysis(departmentId?: string): Promise<{
        userBottlenecks: any;
        divisionBottlenecks: any;
        overdueFiles: any;
    }>;
    generateReport(reportType: 'summary' | 'detailed' | 'user_performance' | 'department', departmentId?: string, dateFrom?: Date, dateTo?: Date): Promise<{
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
    private calculatePerformanceScore;
}
