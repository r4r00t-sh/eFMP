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
exports.TimingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
let TimingService = class TimingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculateTimeRemaining(fileId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
            include: { department: true },
        });
        if (!file || !file.dueDate) {
            return null;
        }
        const now = new Date();
        const dueDate = new Date(file.dueDate);
        const diffMs = dueDate.getTime() - now.getTime();
        return Math.max(0, Math.floor(diffMs / 1000));
    }
    async updateTimeRemaining(fileId) {
        const timeRemaining = await this.calculateTimeRemaining(fileId);
        await this.prisma.file.update({
            where: { id: fileId },
            data: { timeRemaining },
        });
    }
    async updateAllTimeRemaining() {
        const files = await this.prisma.file.findMany({
            where: {
                status: {
                    in: ['PENDING', 'IN_PROGRESS'],
                },
                dueDate: { not: null },
            },
        });
        for (const file of files) {
            await this.updateTimeRemaining(file.id);
        }
    }
    async handleCron() {
        await this.updateAllTimeRemaining();
    }
    async isHoliday(date) {
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return true;
        }
        const holiday = await this.prisma.holiday.findUnique({
            where: { date },
        });
        return !!holiday;
    }
    async addBusinessDays(startDate, days) {
        let currentDate = new Date(startDate);
        let addedDays = 0;
        while (addedDays < days) {
            currentDate.setDate(currentDate.getDate() + 1);
            if (!(await this.isHoliday(currentDate))) {
                addedDays++;
            }
        }
        return currentDate;
    }
};
exports.TimingService = TimingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TimingService.prototype, "handleCron", null);
exports.TimingService = TimingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TimingService);
//# sourceMappingURL=timing.service.js.map