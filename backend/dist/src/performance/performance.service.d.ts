import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PerformanceService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    getConfig(key: string): Promise<any>;
    setConfig(key: string, value: any, description?: string): Promise<any>;
    private getDefaultConfig;
    awardCoinsForOptimumFile(userId: string, fileId: string): Promise<{
        coins: number;
        newBalance: any;
    }>;
    awardCoinsForExcessFiles(userId: string, excessCount: number): Promise<{
        coins: number;
        newBalance: any;
    }>;
    deductCoinsForRedFlag(userId: string, fileId: string, flagType: string): Promise<{
        coins: number;
        newBalance: number;
    }>;
    logWorkingHours(userId: string, date: Date, hours: number, isManual?: boolean): Promise<any>;
    calculateWorkingHoursFromActivity(userId: string, date: Date): Promise<{
        filesProcessed: any;
        filesCreated: any;
        estimatedHours: number;
    }>;
    checkHoursBadges(userId: string, date: Date, hours: number): Promise<void>;
    checkVolumeBadges(deskId: string): Promise<void>;
    checkMomentumBadges(deskId: string, filesProcessedToday: number): Promise<void>;
    createRedFlag(data: {
        userId?: string;
        deskId?: string;
        fileId?: string;
        flagType: string;
        severity?: string;
        description?: string;
    }): Promise<any>;
    checkRedFlagThreshold(userId: string): Promise<void>;
    sendLowCoinsNotification(userId: string, balance: number): Promise<void>;
    getUserPerformance(userId: string, dateFrom?: Date, dateTo?: Date): Promise<{
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
    resolveRedFlag(flagId: string, resolvedBy: string, resolutionNote?: string): Promise<any>;
}
