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
exports.RedListService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const gamification_service_1 = require("../gamification/gamification.service");
const rabbitmq_service_1 = require("../rabbitmq/rabbitmq.service");
const schedule_1 = require("@nestjs/schedule");
let RedListService = class RedListService {
    prisma;
    gamification;
    rabbitmq;
    constructor(prisma, gamification, rabbitmq) {
        this.prisma = prisma;
        this.gamification = gamification;
        this.rabbitmq = rabbitmq;
    }
    async updateRedList() {
        console.log('Running red list check...');
        const now = new Date();
        const overdueFiles = await this.prisma.file.findMany({
            where: {
                OR: [
                    { timeRemaining: { lte: 0 } },
                    { dueDate: { lte: now } },
                    { deskDueDate: { lte: now } },
                ],
                isRedListed: false,
                isOnHold: false,
                status: {
                    in: ['PENDING', 'IN_PROGRESS'],
                },
            },
            include: {
                assignedTo: true,
                department: true,
            },
        });
        console.log(`Found ${overdueFiles.length} files to red list`);
        for (const file of overdueFiles) {
            await this.prisma.file.update({
                where: { id: file.id },
                data: {
                    isRedListed: true,
                    redListedAt: now,
                    timerPercentage: 0,
                },
            });
            if (file.assignedToId) {
                await this.gamification.deductForRedList(file.assignedToId, file.id, file.fileNumber);
                await this.rabbitmq.publishToast({
                    userId: file.assignedToId,
                    type: 'file_redlisted',
                    title: 'File Red Listed',
                    message: `File ${file.fileNumber} has exceeded time limit and is now red listed`,
                    fileId: file.id,
                    priority: 'urgent',
                });
            }
            const admins = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { role: 'SUPER_ADMIN' },
                        { role: 'DEPT_ADMIN', departmentId: file.departmentId },
                    ],
                    isActive: true,
                },
                select: { id: true },
            });
            for (const admin of admins) {
                await this.rabbitmq.publishToast({
                    userId: admin.id,
                    type: 'admin_file_redlisted',
                    title: 'File Red Listed',
                    message: `File ${file.fileNumber} assigned to ${file.assignedTo?.name || 'Unknown'} has been red listed`,
                    fileId: file.id,
                    priority: 'high',
                });
            }
        }
    }
    async getRedListFiles(departmentId) {
        const where = {
            isRedListed: true,
            status: {
                in: ['PENDING', 'IN_PROGRESS'],
            },
        };
        if (departmentId) {
            where.departmentId = departmentId;
        }
        return this.prisma.file.findMany({
            where,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: {
                dueDate: 'asc',
            },
        });
    }
};
exports.RedListService = RedListService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedListService.prototype, "updateRedList", null);
exports.RedListService = RedListService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gamification_service_1.GamificationService,
        rabbitmq_service_1.RabbitMQService])
], RedListService);
//# sourceMappingURL=redlist.service.js.map