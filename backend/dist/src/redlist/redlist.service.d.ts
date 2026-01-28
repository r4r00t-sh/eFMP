import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
export declare class RedListService {
    private prisma;
    private gamification;
    private rabbitmq;
    constructor(prisma: PrismaService, gamification: GamificationService, rabbitmq: RabbitMQService);
    updateRedList(): Promise<void>;
    getRedListFiles(departmentId?: string): Promise<any>;
}
