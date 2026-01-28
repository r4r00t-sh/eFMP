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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const presence_service_1 = require("./presence.service");
let PresenceGateway = class PresenceGateway {
    presenceService;
    server;
    constructor(presenceService) {
        this.presenceService = presenceService;
    }
    async handleConnection(client) {
        const userId = client.handshake.auth?.userId;
        if (userId) {
            client.data.userId = userId;
            await this.presenceService.updateHeartbeat(userId);
        }
    }
    async handleDisconnect(client) {
        const userId = client.data?.userId;
        if (userId) {
            await this.presenceService.markAbsent(userId);
        }
    }
    async handleHeartbeat(client) {
        const userId = client.data?.userId;
        if (userId) {
            await this.presenceService.updateHeartbeat(userId);
            return { status: 'ok' };
        }
        return { status: 'error', message: 'User not authenticated' };
    }
    async handleGetPresence(data) {
        const status = await this.presenceService.getPresenceStatus(data.userId);
        return { userId: data.userId, status };
    }
};
exports.PresenceGateway = PresenceGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PresenceGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('heartbeat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], PresenceGateway.prototype, "handleHeartbeat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('get-presence'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PresenceGateway.prototype, "handleGetPresence", null);
exports.PresenceGateway = PresenceGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/presence',
    }),
    __metadata("design:paramtypes", [presence_service_1.PresenceService])
], PresenceGateway);
//# sourceMappingURL=presence.gateway.js.map