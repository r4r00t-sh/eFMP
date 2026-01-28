import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAllUsers(
    @Request() req,
    @Query('departmentId') departmentId?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    // Only admins can list users
    if (!['SUPER_ADMIN', 'DEPT_ADMIN'].includes(req.user.role)) {
      throw new ForbiddenException('Not authorized');
    }

    // DEPT_ADMIN can only see their department users
    const filterDeptId = req.user.role === 'DEPT_ADMIN' ? req.user.departmentId : departmentId;

    return this.usersService.getAllUsers({ departmentId: filterDeptId, role, search });
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @Request() req) {
    // Users can view themselves, admins can view others
    if (id !== req.user.id && !['SUPER_ADMIN', 'DEPT_ADMIN'].includes(req.user.role)) {
      throw new ForbiddenException('Not authorized');
    }
    return this.usersService.getUserById(id);
  }

  @Post()
  async createUser(
    @Request() req,
    @Body() body: {
      username: string;
      password: string;
      name: string;
      email?: string;
      role: string;
      departmentId?: string;
      divisionId?: string;
    },
  ) {
    // Only admins can create users
    if (!['SUPER_ADMIN', 'DEPT_ADMIN'].includes(req.user.role)) {
      throw new ForbiddenException('Not authorized');
    }

    // DEPT_ADMIN can only create users in their department
    if (req.user.role === 'DEPT_ADMIN' && body.departmentId !== req.user.departmentId) {
      throw new ForbiddenException('Can only create users in your department');
    }

    return this.usersService.createUser(body);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Request() req,
    @Body() body: {
      name?: string;
      email?: string;
      role?: string;
      departmentId?: string;
      divisionId?: string;
      isActive?: boolean;
    },
  ) {
    // Only admins can update users (except self profile updates)
    if (id !== req.user.id && !['SUPER_ADMIN', 'DEPT_ADMIN'].includes(req.user.role)) {
      throw new ForbiddenException('Not authorized');
    }

    // Regular users can only update name/email for themselves
    if (id === req.user.id && !['SUPER_ADMIN', 'DEPT_ADMIN'].includes(req.user.role)) {
      return this.usersService.updateUser(id, {
        name: body.name,
        email: body.email,
      });
    }

    return this.usersService.updateUser(id, body);
  }

  @Put(':id/password')
  async updatePassword(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { currentPassword?: string; newPassword: string },
  ) {
    // Users can change their own password, admins can reset others
    if (id !== req.user.id && !['SUPER_ADMIN'].includes(req.user.role)) {
      throw new ForbiddenException('Not authorized');
    }

    // If changing own password, require current password
    if (id === req.user.id && !['SUPER_ADMIN'].includes(req.user.role)) {
      return this.usersService.changePassword(id, body.currentPassword!, body.newPassword);
    }

    // Admin reset (no current password needed)
    return this.usersService.resetPassword(id, body.newPassword);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    // Only SUPER_ADMIN can delete users
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Not authorized');
    }
    return this.usersService.deactivateUser(id);
  }
}

