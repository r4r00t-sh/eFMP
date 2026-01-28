import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
export declare class GamificationService {
    private prisma;
    private rabbitmq;
    private readonly DEFAULT_BASE_POINTS;
    private readonly DEFAULT_REDLIST_PENALTY;
    private readonly DEFAULT_MONTHLY_BONUS;
    private readonly DEFAULT_REDLIST_WARNING_THRESHOLD;
    private readonly DEFAULT_REDLIST_SEVERE_THRESHOLD;
    constructor(prisma: PrismaService, rabbitmq: RabbitMQService);
    initializeUserPoints(userId: string): Promise<void>;
    deductForRedList(userId: string, fileId: string, fileNumber: string): Promise<void>;
    processMonthlyBonuses(): Promise<void>;
    getUserPoints(userId: string): Promise<any>;
    getPointsHistory(userId: string, limit?: number): Promise<any>;
    manualAdjustPoints(userId: string, amount: number, reason: string, adminId: string): Promise<void>;
    private getSetting;
    private notifyAdminsAboutUser;
    checkAndAwardStreak(userId: string): Promise<void>;
}
