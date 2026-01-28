import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TimingService {
  constructor(private prisma: PrismaService) {}

  async calculateTimeRemaining(fileId: string): Promise<number | null> {
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
    
    return Math.max(0, Math.floor(diffMs / 1000)); // Return seconds
  }

  async updateTimeRemaining(fileId: string): Promise<void> {
    const timeRemaining = await this.calculateTimeRemaining(fileId);
    
    await this.prisma.file.update({
      where: { id: fileId },
      data: { timeRemaining },
    });
  }

  async updateAllTimeRemaining(): Promise<void> {
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

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.updateAllTimeRemaining();
  }

  async isHoliday(date: Date): Promise<boolean> {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true; // Weekend
    }

    const holiday = await this.prisma.holiday.findUnique({
      where: { date },
    });

    return !!holiday;
  }

  async addBusinessDays(startDate: Date, days: number): Promise<Date> {
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
}

