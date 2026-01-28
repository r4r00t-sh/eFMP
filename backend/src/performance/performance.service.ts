import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PerformanceService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Get performance configuration
  async getConfig(key: string) {
    const config = await this.prisma.performanceConfig.findUnique({
      where: { key },
    });
    return config?.value || null;
  }

  // Set performance configuration
  async setConfig(key: string, value: any, description?: string) {
    return this.prisma.performanceConfig.upsert({
      where: { key },
      update: { value, description, updatedAt: new Date() },
      create: { key, value, description },
    });
  }

  // Get default config values
  private async getDefaultConfig() {
    const highVolumeThreshold = await this.getConfig('high_volume_threshold');
    const highMomentumThreshold = await this.getConfig('high_momentum_threshold');
    const optimumHours = await this.getConfig('optimum_hours_per_day');
    const coinThreshold = await this.getConfig('coin_threshold_warning');
    const filesPerDayOptimum = await this.getConfig('files_per_day_optimum');

    return {
      highVolumeThreshold: highVolumeThreshold || 10,
      highMomentumThreshold: highMomentumThreshold || 5,
      optimumHours: optimumHours || 8,
      coinThreshold: coinThreshold || 100,
      filesPerDayOptimum: filesPerDayOptimum || 5,
      coinPerOptimumFile: 10,
      coinPerExcessFile: 5,
      redFlagThreshold: 3,
    };
  }

  // Award coins for file processed within optimum time
  async awardCoinsForOptimumFile(userId: string, fileId: string) {
    const config = await this.getDefaultConfig();
    const coins = config.coinPerOptimumFile;

    // Get current balance
    const userPoints = await this.prisma.userPoints.findUnique({
      where: { userId },
    });

    const currentBalance = userPoints?.currentPoints || 0;
    const newBalance = currentBalance + coins;

    // Update user points
    await this.prisma.userPoints.upsert({
      where: { userId },
      update: {
        currentPoints: newBalance,
      },
      create: {
        userId,
        currentPoints: coins,
        basePoints: coins,
      },
    });

    // Create coin transaction
    await this.prisma.coinTransaction.create({
      data: {
        userId,
        fileId,
        amount: coins,
        balanceAfter: newBalance,
        transactionType: 'file_processed_optimum',
        description: `Awarded ${coins} coins for processing file within optimum time`,
      },
    });

    // Check if balance dropped below threshold
    const threshold = Number(config.coinThreshold);
    if (currentBalance >= threshold && newBalance < threshold) {
      await this.sendLowCoinsNotification(userId, newBalance);
    }

    return { coins, newBalance };
  }

  // Award coins for processing excess files
  async awardCoinsForExcessFiles(userId: string, excessCount: number) {
    const config = await this.getDefaultConfig();
    const coins = excessCount * config.coinPerExcessFile;

    const userPoints = await this.prisma.userPoints.findUnique({
      where: { userId },
    });

    const currentBalance = userPoints?.currentPoints || 0;
    const newBalance = currentBalance + coins;

    await this.prisma.userPoints.upsert({
      where: { userId },
      update: {
        currentPoints: newBalance,
      },
      create: {
        userId,
        currentPoints: coins,
        basePoints: coins,
      },
    });

    await this.prisma.coinTransaction.create({
      data: {
        userId,
        amount: coins,
        balanceAfter: newBalance,
        transactionType: 'excess_files',
        description: `Awarded ${coins} coins for processing ${excessCount} excess files`,
      },
    });

    return { coins, newBalance };
  }

  // Deduct coins for red flag
  async deductCoinsForRedFlag(userId: string, fileId: string, flagType: string) {
    const config = await this.getDefaultConfig();
    const deduction = 20; // Fixed deduction per red flag

    const userPoints = await this.prisma.userPoints.findUnique({
      where: { userId },
    });

    if (!userPoints) return { coins: 0, newBalance: 0 };

    const currentBalance = userPoints.currentPoints;
    const newBalance = Math.max(0, currentBalance - deduction);

    await this.prisma.userPoints.update({
      where: { userId },
      data: {
        currentPoints: newBalance,
        redListDeductions: { increment: deduction },
      },
    });

    await this.prisma.coinTransaction.create({
      data: {
        userId,
        fileId,
        amount: -deduction,
        balanceAfter: newBalance,
        transactionType: 'red_flag_deduction',
        description: `Deducted ${deduction} coins for ${flagType}`,
      },
    });

    // Check threshold
    const threshold = Number(config.coinThreshold);
    if (currentBalance >= threshold && newBalance < threshold) {
      await this.sendLowCoinsNotification(userId, newBalance);
    }

    return { coins: -deduction, newBalance };
  }

  // Track working hours
  async logWorkingHours(userId: string, date: Date, hours: number, isManual: boolean = false) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    return this.prisma.workingHours.upsert({
      where: {
        userId_date: {
          userId: userId,
          date: dateOnly,
        },
      },
      update: {
        hoursWorked: isManual ? hours : undefined,
        hoursLogged: isManual ? hours : undefined,
        isLogged: isManual,
      },
      create: {
        userId,
        date: dateOnly,
        hoursWorked: hours,
        hoursLogged: isManual ? hours : undefined,
        isLogged: isManual,
        filesProcessed: 0,
        filesCreated: 0,
      },
    });
  }

  // Calculate working hours from file activity
  async calculateWorkingHoursFromActivity(userId: string, date: Date) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateOnly);
    nextDay.setDate(nextDay.getDate() + 1);

    // Count files processed (forwarded, approved, rejected)
    const filesProcessed = await this.prisma.fileRouting.count({
      where: {
        fromUserId: userId,
        createdAt: {
          gte: dateOnly,
          lt: nextDay,
        },
        action: {
          in: ['FORWARDED', 'APPROVED', 'REJECTED', 'DISPATCHED'],
        },
      },
    });

    // Count files created
    const filesCreated = await this.prisma.file.count({
      where: {
        createdById: userId,
        createdAt: {
          gte: dateOnly,
          lt: nextDay,
        },
      },
    });

    // Estimate hours (rough calculation: 1 file = 0.5 hours average)
    const estimatedHours = (filesProcessed * 0.5) + (filesCreated * 0.3);

    await this.prisma.workingHours.upsert({
      where: {
        userId_date: {
          userId,
          date: dateOnly,
        },
      },
      update: {
        filesProcessed,
        filesCreated,
        hoursWorked: estimatedHours,
      },
      create: {
        userId,
        date: dateOnly,
        filesProcessed,
        filesCreated,
        hoursWorked: estimatedHours,
        isLogged: false,
      },
    });

    // Check for low/extended hours badges
    await this.checkHoursBadges(userId, dateOnly, estimatedHours);

    return { filesProcessed, filesCreated, estimatedHours };
  }

  // Check and award hours badges
  async checkHoursBadges(userId: string, date: Date, hours: number) {
    const config = await this.getDefaultConfig();
    const optimumHours = Number(config.optimumHours);

    // Remove existing hours badges for this date
    await this.prisma.performanceBadge.deleteMany({
      where: {
        userId,
        badgeType: { in: ['low_hours', 'extended_hours'] },
        awardedAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (hours < optimumHours * 0.5) {
      // Low hours badge
      await this.prisma.performanceBadge.create({
        data: {
          userId,
          badgeType: 'low_hours',
          badgeName: 'Low Hours Indicator',
          description: `Worked ${hours.toFixed(1)} hours (below 50% of optimum ${optimumHours} hours)`,
          metricValue: hours,
          threshold: optimumHours * 0.5,
        },
      });
    } else if (hours > optimumHours * 1.5) {
      // Extended hours badge
      await this.prisma.performanceBadge.create({
        data: {
          userId,
          badgeType: 'extended_hours',
          badgeName: 'Extended Hours Indicator',
          description: `Worked ${hours.toFixed(1)} hours (above 150% of optimum ${optimumHours} hours)`,
          metricValue: hours,
          threshold: optimumHours * 1.5,
        },
      });
    }
  }

  // Check and award volume badges
  async checkVolumeBadges(deskId: string) {
    const config = await this.getDefaultConfig();
    const threshold = Number(config.highVolumeThreshold);

    const desk = await this.prisma.desk.findUnique({
      where: { id: deskId },
      include: {
        _count: {
          select: { files: true },
        },
      },
    });

    if (!desk) return;

    const currentFiles = desk._count.files;
    const utilization = (currentFiles / desk.maxFilesPerDay) * 100;

    // Remove existing volume badge
    await this.prisma.performanceBadge.deleteMany({
      where: {
        deskId,
        badgeType: 'high_volume',
      },
    });

    if (utilization > threshold) {
      await this.prisma.performanceBadge.create({
        data: {
          deskId,
          badgeType: 'high_volume',
          badgeName: 'High Volume Desk',
          description: `Desk has ${currentFiles} files (${utilization.toFixed(1)}% utilization)`,
          metricValue: utilization,
          threshold,
        },
      });
    }
  }

  // Check and award momentum badges
  async checkMomentumBadges(deskId: string, filesProcessedToday: number) {
    const config = await this.getDefaultConfig();
    const threshold = Number(config.highMomentumThreshold);

    // Remove existing momentum badge
    await this.prisma.performanceBadge.deleteMany({
      where: {
        deskId,
        badgeType: 'high_momentum',
        awardedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    if (filesProcessedToday >= threshold) {
      await this.prisma.performanceBadge.create({
        data: {
          deskId,
          badgeType: 'high_momentum',
          badgeName: 'High Momentum Desk',
          description: `Processed ${filesProcessedToday} files today`,
          metricValue: filesProcessedToday,
          threshold,
        },
      });
    }
  }

  // Create red flag
  async createRedFlag(data: {
    userId?: string;
    deskId?: string;
    fileId?: string;
    flagType: string;
    severity?: string;
    description?: string;
  }) {
    const flag = await this.prisma.redFlag.create({
      data: {
        userId: data.userId,
        deskId: data.deskId,
        fileId: data.fileId,
        flagType: data.flagType,
        severity: data.severity || 'medium',
        description: data.description,
      },
    });

    // Deduct coins if user red flag
    if (data.userId) {
      await this.deductCoinsForRedFlag(data.userId, data.fileId || '', data.flagType);
    }

    // Check red flag threshold
    if (data.userId) {
      await this.checkRedFlagThreshold(data.userId);
    }

    return flag;
  }

  // Check red flag threshold and send notification
  async checkRedFlagThreshold(userId: string) {
    const config = await this.getDefaultConfig();
    const threshold = Number(config.redFlagThreshold);

    const redFlagCount = await this.prisma.redFlag.count({
      where: {
        userId,
        isResolved: false,
      },
    });

    if (redFlagCount >= threshold) {
      // Send notification for training/review
      await this.notifications.createNotification({
        userId,
        type: 'red_flag_threshold',
        title: 'Performance Review Required',
        message: `You have ${redFlagCount} unresolved red flags. A review meeting is recommended.`,
        priority: 'high',
        actionRequired: true,
      });
    }
  }

  // Send low coins notification
  async sendLowCoinsNotification(userId: string, balance: number) {
    await this.notifications.createNotification({
      userId,
      type: 'low_coins',
      title: 'Low Coin Balance',
      message: `Your coin balance (${balance}) has dropped below the threshold. Training or review meeting recommended.`,
      priority: 'high',
      actionRequired: true,
    });
  }

  // Get user performance summary
  async getUserPerformance(userId: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = { userId };
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    const [workingHours, badges, coins, redFlags] = await Promise.all([
      this.prisma.workingHours.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 30,
      }),
      this.prisma.performanceBadge.findMany({
        where: { userId, isActive: true },
        orderBy: { awardedAt: 'desc' },
      }),
      this.prisma.coinTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.redFlag.findMany({
        where: { userId, isResolved: false },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const userPoints = await this.prisma.userPoints.findUnique({
      where: { userId },
    });

    // Calculate total earned from positive transactions
    const totalEarned = coins
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalHours = workingHours.reduce((sum, wh) => sum + wh.hoursWorked, 0);
    const avgHours = workingHours.length > 0 ? totalHours / workingHours.length : 0;
    const totalFilesProcessed = workingHours.reduce((sum, wh) => sum + wh.filesProcessed, 0);

    return {
      currentCoins: userPoints?.currentPoints || 0,
      totalEarned,
      redListDeductions: userPoints?.redListDeductions || 0,
      workingHours: {
        total: totalHours,
        average: avgHours,
        records: workingHours,
      },
      filesProcessed: totalFilesProcessed,
      badges,
      recentTransactions: coins,
      redFlags,
    };
  }

  // Get desk performance summary
  async getDeskPerformance(deskId: string) {
    const [badges, redFlags, files] = await Promise.all([
      this.prisma.performanceBadge.findMany({
        where: { deskId, isActive: true },
        orderBy: { awardedAt: 'desc' },
      }),
      this.prisma.redFlag.findMany({
        where: { deskId, isResolved: false },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({
        where: { deskId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
    ]);

    const desk = await this.prisma.desk.findUnique({
      where: { id: deskId },
    });

    if (!desk) throw new NotFoundException('Desk not found');

    return {
      desk,
      currentFiles: files,
      badges,
      redFlags,
    };
  }

  // Resolve red flag
  async resolveRedFlag(flagId: string, resolvedBy: string, resolutionNote?: string) {
    return this.prisma.redFlag.update({
      where: { id: flagId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNote,
      },
    });
  }
}

