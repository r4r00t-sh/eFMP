"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqp = __importStar(require("amqplib"));
let RabbitMQService = class RabbitMQService {
    configService;
    connection;
    channel;
    queueName = 'actionable_toasts';
    notificationsQueue = 'notifications';
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const url = this.configService.get('RABBITMQ_URL', 'amqp://efiling:efiling123@localhost:5672');
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        await this.channel.assertQueue(this.queueName, { durable: true });
        await this.channel.assertQueue(this.notificationsQueue, { durable: true });
    }
    async onModuleDestroy() {
        if (this.channel)
            await this.channel.close();
        if (this.connection)
            await this.connection.close();
    }
    async publishToast(toast) {
        await this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(toast)), { persistent: true });
    }
    async publish(queue, data) {
        await this.channel.assertQueue(queue, { durable: true });
        await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), { persistent: true });
    }
    async consumeToasts(callback) {
        await this.channel.consume(this.queueName, async (msg) => {
            if (msg) {
                const toast = JSON.parse(msg.content.toString());
                await callback(toast);
                this.channel.ack(msg);
            }
        });
    }
    async consumeNotifications(callback) {
        await this.channel.consume(this.notificationsQueue, async (msg) => {
            if (msg) {
                const notification = JSON.parse(msg.content.toString());
                await callback(notification);
                this.channel.ack(msg);
            }
        });
    }
};
exports.RabbitMQService = RabbitMQService;
exports.RabbitMQService = RabbitMQService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RabbitMQService);
//# sourceMappingURL=rabbitmq.service.js.map