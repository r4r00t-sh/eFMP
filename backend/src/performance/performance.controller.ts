import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { PerformanceService } from './performance.service';

@Controller('performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private performanceService: PerformanceService) {}

  // Get user performance
  @Get('user/:userId')
  async getUserPerformance(
    @Param('userId') userId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.performanceService.getUserPerformance(
      userId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  // Get my performance
  @Get('me')
  async getMyPerformance(
    @Request() req,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.performanceService.getUserPerformance(
      req.user.id,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  // Get desk performance
  @Get('desk/:deskId')
  async getDeskPerformance(@Param('deskId') deskId: string) {
    return this.performanceService.getDeskPerformance(deskId);
  }

  // Log working hours manually
  @Post('working-hours')
  async logWorkingHours(
    @Request() req,
    @Body() body: { date: string; hours: number },
  ) {
    return this.performanceService.logWorkingHours(
      req.user.id,
      new Date(body.date),
      body.hours,
      true,
    );
  }

  // Calculate working hours from activity
  @Post('working-hours/calculate')
  async calculateWorkingHours(@Request() req, @Body() body: { date?: string }) {
    const date = body.date ? new Date(body.date) : new Date();
    return this.performanceService.calculateWorkingHoursFromActivity(
      req.user.id,
      date,
    );
  }

  // Get performance config
  @Get('config/:key')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getConfig(@Param('key') key: string) {
    return this.performanceService.getConfig(key);
  }

  // Set performance config
  @Post('config')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async setConfig(
    @Body() body: { key: string; value: any; description?: string },
  ) {
    return this.performanceService.setConfig(
      body.key,
      body.value,
      body.description,
    );
  }

  // Resolve red flag
  @Patch('red-flags/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_ADMIN)
  async resolveRedFlag(
    @Param('id') flagId: string,
    @Request() req,
    @Body() body: { resolutionNote?: string },
  ) {
    return this.performanceService.resolveRedFlag(
      flagId,
      req.user.id,
      body.resolutionNote,
    );
  }
}
