import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

// Toast types for the system
export type ToastType =
  | 'file_received'
  | 'time_request'
  | 'time_approved'
  | 'time_denied'
  | 'extension_request'
  | 'extension_approved'
  | 'extension_denied'
  | 'admin_extension_requested'
  | 'admin_extension_approved'
  | 'admin_extension_denied'
  | 'file_redlisted'
  | 'admin_file_redlisted'
  | 'admin_user_warning_redlist'
  | 'admin_user_severe_redlist'
  | 'notification';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly queueName = 'actionable_toasts';
  private readonly notificationsQueue = 'notifications';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://efiling:efiling123@localhost:5672',
    );
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
    await this.channel.assertQueue(this.notificationsQueue, { durable: true });
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }

  async publishToast(toast: {
    userId: string;
    type: ToastType;
    title: string;
    message: string;
    fileId?: string;
    extensionReqId?: string;
    requestId?: string;
    priority?: string;
    actions?: Array<{ label: string; action: string; payload?: any }>;
  }): Promise<void> {
    await this.channel.sendToQueue(
      this.queueName,
      Buffer.from(JSON.stringify(toast)),
      { persistent: true },
    );
  }

  // Generic publish to any queue
  async publish(queue: string, data: any): Promise<void> {
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }

  async consumeToasts(callback: (toast: any) => Promise<void>): Promise<void> {
    await this.channel.consume(this.queueName, async (msg) => {
      if (msg) {
        const toast = JSON.parse(msg.content.toString());
        await callback(toast);
        this.channel.ack(msg);
      }
    });
  }

  async consumeNotifications(
    callback: (notification: any) => Promise<void>,
  ): Promise<void> {
    await this.channel.consume(this.notificationsQueue, async (msg) => {
      if (msg) {
        const notification = JSON.parse(msg.content.toString());
        await callback(notification);
        this.channel.ack(msg);
      }
    });
  }
}
