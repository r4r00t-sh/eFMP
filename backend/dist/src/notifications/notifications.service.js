"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const rabbitmq_service_1 = require("../rabbitmq/rabbitmq.service");
let NotificationsService = class NotificationsService {
    prisma;
    rabbitmq;
    constructor(prisma, rabbitmq) {
        this.prisma = prisma;
        this.rabbitmq = rabbitmq;
    }
    async createNotification(data) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                fileId: data.fileId,
                extensionReqId: data.extensionReqId,
                priority: data.priority || 'normal',
                actionRequired: data.actionRequired || false,
                actionType: data.actionType,
                metadata: data.metadata,
            },
        });
        await this.rabbitmq.publish('notifications', {
            userId: data.userId,
            notification,
        });
        return notification;
    }
    async getUserNotifications(userId, includeRead = false) {
        const where = { userId };
        if (!includeRead) {
            where.isDismissed = false;
        }
        return this.prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async markAsRead(notificationId, userId) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }
    async markAsDismissed(notificationId, userId) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isDismissed: true, isRead: true },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: { userId, isRead: false, isDismissed: false },
        });
    }
    async notifyFileReceived(recipientId, senderId, fileId, fileNumber, subject) {
        const sender = await this.prisma.user.findUnique({
            where: { id: senderId },
            select: { name: true },
        });
        return this.createNotification({
            userId: recipientId,
            type: 'file_received',
            title: 'File Received',
            message: `You have received file ${fileNumber}: "${subject}" from ${sender?.name || 'Unknown'}`,
            fileId,
            priority: 'high',
            actionRequired: true,
            actionType: 'request_extension',
            metadata: { senderId, fileNumber, subject },
        });
    }
    async notifyExtensionRequest(approverId, requesterId, fileId, fileNumber, extensionReqId, additionalTime) {
        const requester = await this.prisma.user.findUnique({
            where: { id: requesterId },
            select: { name: true },
        });
        const hours = Math.floor(additionalTime / 3600);
        const timeStr = hours > 24 ? `${Math.floor(hours / 24)} days` : `${hours} hours`;
        return this.createNotification({
            userId: approverId,
            type: 'extension_request',
            title: 'Extra Time Request',
            message: `${requester?.name || 'A user'} requested ${timeStr} extra time for file ${fileNumber}`,
            fileId,
            extensionReqId,
            priority: 'high',
            actionRequired: true,
            actionType: 'approve_deny_extension',
            metadata: { requesterId, fileNumber, additionalTime },
        });
    }
    async notifyExtensionDecision(requesterId, approverId, fileId, fileNumber, approved, remarks) {
        const approver = await this.prisma.user.findUnique({
            where: { id: approverId },
            select: { name: true },
        });
        return this.createNotification({
            userId: requesterId,
            type: approved ? 'extension_approved' : 'extension_denied',
            title: approved ? 'Extra Time Approved' : 'Extra Time Denied',
            message: approved
                ? `Your extra time request for file ${fileNumber} was approved by ${approver?.name || 'Unknown'}`
                : `Your extra time request for file ${fileNumber} was denied by ${approver?.name || 'Unknown'}${remarks ? `: ${remarks}` : ''}`,
            fileId,
            priority: approved ? 'normal' : 'high',
            metadata: { approverId, fileNumber, approved, remarks },
        });
    }
    async notifyAdminsExtensionAction(departmentId, action, requesterId, approverId, fileId, fileNumber) {
        const requester = await this.prisma.user.findUnique({
            where: { id: requesterId },
            select: { name: true },
        });
        const approver = approverId
            ? await this.prisma.user.findUnique({
                where: { id: approverId },
                select: { name: true },
            })
            : null;
        const admins = await this.prisma.user.findMany({
            where: {
                OR: [
                    { role: 'SUPER_ADMIN' },
                    { role: 'DEPT_ADMIN', departmentId },
                ],
                isActive: true,
            },
            select: { id: true },
        });
        const messages = {
            requested: `${requester?.name} requested extra time for file ${fileNumber}`,
            approved: `${approver?.name || 'Unknown'} approved extra time request from ${requester?.name} for file ${fileNumber}`,
            denied: `${approver?.name || 'Unknown'} denied extra time request from ${requester?.name} for file ${fileNumber}`,
        };
        for (const admin of admins) {
            await this.createNotification({
                userId: admin.id,
                type: `admin_extension_${action}`,
                title: `Extension ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                message: messages[action] || `Extension action: ${action}`,
                fileId,
                priority: 'normal',
                metadata: { requesterId, approverId, fileNumber, action },
            });
        }
    }
    async notifyAdminsRedList(departmentId, userId, fileId, fileNumber) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });
        const admins = await this.prisma.user.findMany({
            where: {
                OR: [
                    { role: 'SUPER_ADMIN' },
                    { role: 'DEPT_ADMIN', departmentId },
                ],
                isActive: true,
            },
            select: { id: true },
        });
        for (const admin of admins) {
            await this.createNotification({
                userId: admin.id,
                type: 'admin_file_redlisted',
                title: 'File Red Listed',
                message: `File ${fileNumber} assigned to ${user?.name || 'Unknown'} has been red listed due to timeout`,
                fileId,
                priority: 'urgent',
                metadata: { userId, fileNumber },
            });
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rabbitmq_service_1.RabbitMQService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map