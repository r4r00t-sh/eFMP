import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private gamificationService: GamificationService) {}

  @Get('points/:userId')
  async getUserPoints(@Param('userId') userId: string) {
    return this.gamificationService.getUserPoints(userId);
  }
}

