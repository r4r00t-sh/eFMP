import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { PresenceService } from './presence.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/presence',
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private presenceService: PresenceService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) {
      client.data.userId = userId;
      await this.presenceService.updateHeartbeat(userId);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      await this.presenceService.markAbsent(userId);
    }
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      await this.presenceService.updateHeartbeat(userId);
      return { status: 'ok' };
    }
    return { status: 'error', message: 'User not authenticated' };
  }

  @SubscribeMessage('get-presence')
  async handleGetPresence(@MessageBody() data: { userId: string }) {
    const status = await this.presenceService.getPresenceStatus(data.userId);
    return { userId: data.userId, status };
  }
}

