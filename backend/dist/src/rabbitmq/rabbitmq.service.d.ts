import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export type ToastType = 'file_received' | 'time_request' | 'time_approved' | 'time_denied' | 'extension_request' | 'extension_approved' | 'extension_denied' | 'admin_extension_requested' | 'admin_extension_approved' | 'admin_extension_denied' | 'file_redlisted' | 'admin_file_redlisted' | 'admin_user_warning_redlist' | 'admin_user_severe_redlist' | 'notification';
export declare class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private connection;
    private channel;
    private readonly queueName;
    private readonly notificationsQueue;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publishToast(toast: {
        userId: string;
        type: ToastType;
        title: string;
        message: string;
        fileId?: string;
        extensionReqId?: string;
        requestId?: string;
        priority?: string;
        actions?: Array<{
            label: string;
            action: string;
            payload?: any;
        }>;
    }): Promise<void>;
    publish(queue: string, data: any): Promise<void>;
    consumeToasts(callback: (toast: any) => Promise<void>): Promise<void>;
    consumeNotifications(callback: (notification: any) => Promise<void>): Promise<void>;
}
