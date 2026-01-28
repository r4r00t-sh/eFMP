import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PresenceService } from './presence.service';
export declare class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private presenceService;
    server: Server;
    constructor(presenceService: PresenceService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleHeartbeat(client: Socket): Promise<{
        status: string;
        message?: undefined;
    } | {
        status: string;
        message: string;
    }>;
    handleGetPresence(data: {
        userId: string;
    }): Promise<{
        userId: string;
        status: PresenceStatus;
    }>;
}
