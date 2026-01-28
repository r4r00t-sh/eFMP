import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from '../presence/presence.service';
import { GamificationService } from '../gamification/gamification.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private gamification;
    private presence;
    constructor(prisma: PrismaService, jwtService: JwtService, gamification: GamificationService, presence: PresenceService);
    validateUser(username: string, password: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            email: any;
            name: any;
            role: any;
            departmentId: any;
            divisionId: any;
        };
    }>;
    logout(userId: string): Promise<{
        success: boolean;
    }>;
    register(data: {
        username: string;
        password: string;
        name: string;
        email?: string;
        role?: string;
        departmentId?: string;
        divisionId?: string;
    }): Promise<any>;
}
