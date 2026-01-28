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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const presence_service_1 = require("../presence/presence.service");
const bcrypt = __importStar(require("bcrypt"));
const gamification_service_1 = require("../gamification/gamification.service");
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    prisma;
    jwtService;
    gamification;
    presence;
    constructor(prisma, jwtService, gamification, presence) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.gamification = gamification;
        this.presence = presence;
    }
    async validateUser(username, password) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            include: {
                department: true,
                division: true,
            },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.gamification.initializeUserPoints(user.id);
        const { passwordHash, ...result } = user;
        return result;
    }
    async login(user) {
        const payload = {
            username: user.username,
            sub: user.id,
            role: user.role,
            departmentId: user.departmentId,
        };
        await this.prisma.presence.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                status: client_1.PresenceStatus.ACTIVE,
                lastPing: new Date(),
                loginTime: new Date(),
                logoutTime: null,
                logoutType: null,
            },
            update: {
                status: client_1.PresenceStatus.ACTIVE,
                lastPing: new Date(),
                loginTime: new Date(),
                logoutTime: null,
                logoutType: null,
            },
        });
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                departmentId: user.departmentId,
                divisionId: user.divisionId,
            },
        };
    }
    async logout(userId) {
        await this.prisma.presence.upsert({
            where: { userId },
            create: {
                userId,
                status: client_1.PresenceStatus.ABSENT,
                lastPing: new Date(),
                logoutTime: new Date(),
                logoutType: 'manual',
            },
            update: {
                status: client_1.PresenceStatus.ABSENT,
                logoutTime: new Date(),
                logoutType: 'manual',
            },
        });
        return { success: true };
    }
    async register(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                passwordHash: hashedPassword,
                name: data.name,
                role: data.role || 'USER',
                departmentId: data.departmentId,
                divisionId: data.divisionId,
            },
            include: {
                department: true,
                division: true,
            },
        });
        await this.gamification.initializeUserPoints(user.id);
        const { passwordHash, ...result } = user;
        return result;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        gamification_service_1.GamificationService,
        presence_service_1.PresenceService])
], AuthService);
//# sourceMappingURL=auth.service.js.map