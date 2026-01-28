import { PrismaService } from '../prisma/prisma.service';
export declare class TimingService {
    private prisma;
    constructor(prisma: PrismaService);
    calculateTimeRemaining(fileId: string): Promise<number | null>;
    updateTimeRemaining(fileId: string): Promise<void>;
    updateAllTimeRemaining(): Promise<void>;
    handleCron(): Promise<void>;
    isHoliday(date: Date): Promise<boolean>;
    addBusinessDays(startDate: Date, days: number): Promise<Date>;
}
