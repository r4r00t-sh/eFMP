import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket {
  id: string;
  handshake: { auth?: { token?: string }; query?: { token?: string } };
  join: (room: string) => void;
  leave: (room: string) => void;
  disconnect: (close?: boolean) => void;
  data: { userId?: string };
  emit: (event: string, ...args: any[]) => void;
  to: (room: string) => { emit: (event: string, ...args: any[]) => void };
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
      client.data.userId = userId;
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /** Client joins a conversation room to receive live messages */
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    client: AuthenticatedSocket,
    payload: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !payload?.conversationId) return;
    client.join(`conversation:${payload.conversationId}`);
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    client: AuthenticatedSocket,
    payload: { conversationId: string },
  ) {
    if (payload?.conversationId) {
      client.leave(`conversation:${payload.conversationId}`);
    }
  }

  /** Emit new message to all members in the conversation (called from service after save) */
  emitNewMessage(conversationId: string, message: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('new_message', message);
  }

  /** Notify conversation members that someone was added (for groups) */
  emitMembersUpdated(conversationId: string, conversation: any) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('members_updated', conversation);
  }
}
