import { PrismaService } from '../prisma/prisma.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
export interface CreateNotificationDto {
    userId: string;
    type: string;
    title: string;
    message: string;
    fileId?: string;
    extensionReqId?: string;
    priority?: string;
    actionRequired?: boolean;
    actionType?: string;
    metadata?: any;
}
export declare class NotificationsService {
    private prisma;
    private rabbitmq;
    constructor(prisma: PrismaService, rabbitmq: RabbitMQService);
    createNotification(data: CreateNotificationDto): Promise<any>;
    getUserNotifications(userId: string, includeRead?: boolean): Promise<any>;
    markAsRead(notificationId: string, userId: string): Promise<any>;
    markAsDismissed(notificationId: string, userId: string): Promise<any>;
    markAllAsRead(userId: string): Promise<any>;
    getUnreadCount(userId: string): Promise<number>;
    notifyFileReceived(recipientId: string, senderId: string, fileId: string, fileNumber: string, subject: string): Promise<any>;
    notifyExtensionRequest(approverId: string, requesterId: string, fileId: string, fileNumber: string, extensionReqId: string, additionalTime: number): Promise<any>;
    notifyExtensionDecision(requesterId: string, approverId: string, fileId: string, fileNumber: string, approved: boolean, remarks?: string): Promise<any>;
    notifyAdminsExtensionAction(departmentId: string, action: string, requesterId: string, approverId: string | null, fileId: string, fileNumber: string): Promise<void>;
    notifyAdminsRedList(departmentId: string, userId: string, fileId: string, fileNumber: string): Promise<void>;
}
