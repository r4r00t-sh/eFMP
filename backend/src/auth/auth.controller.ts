import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { StrictThrottle } from '../security/throttle.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @StrictThrottle()
  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    return this.authService.login(user);
  }

  @StrictThrottle()
  @Post('register')
  async register(@Body() registerDto: {
    username: string;
    password: string;
    name: string;
    email?: string;
    role?: string;
    departmentId?: string;
    divisionId?: string;
  }) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}

