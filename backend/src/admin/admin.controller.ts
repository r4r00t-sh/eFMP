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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  private checkAdminAccess(userRole: string) {
    if (!['SUPER_ADMIN', 'DEPT_ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Admin access required');
    }
  }

  // Get desk status (user presence)
  @Get('desk-status')
  async getDeskStatus(@Request() req) {
    this.checkAdminAccess(req.user.role);
    return this.adminService.getDeskStatus(req.user.departmentId, req.user.role);
  }

  // Get department files
  @Get('files')
  async getDepartmentFiles(
    @Request() req,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('isRedListed') isRedListed?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.checkAdminAccess(req.user.role);
    return this.adminService.getDepartmentFiles(
      req.user.departmentId,
      req.user.role,
      {
        status,
        search,
        isRedListed: isRedListed === 'true' ? true : isRedListed === 'false' ? false : undefined,
        assignedToId,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
      },
    );
  }

  // Get analytics
  @Get('analytics')
  async getAnalytics(@Request() req) {
    this.checkAdminAccess(req.user.role);
    return this.adminService.getAnalytics(req.user.departmentId, req.user.role);
  }

  // Get department-wise analytics (Super Admin only)
  @Get('analytics/departments')
  async getDepartmentWiseAnalytics(@Request() req) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Super Admin access required');
    }
    return this.adminService.getDepartmentWiseAnalytics();
  }

  // Get red listed files
  @Get('redlist')
  async getRedListedFiles(@Request() req) {
    this.checkAdminAccess(req.user.role);
    return this.adminService.getRedListedFiles(req.user.departmentId, req.user.role);
  }

  // Get extension requests
  @Get('extension-requests')
  async getExtensionRequests(@Request() req) {
    this.checkAdminAccess(req.user.role);
    return this.adminService.getExtensionRequests(req.user.departmentId, req.user.role);
  }

  // Get system settings
  @Get('settings')
  async getSettings(@Request() req) {
    this.checkAdminAccess(req.user.role);
    const departmentId = req.user.role === 'DEPT_ADMIN' ? req.user.departmentId : undefined;
    return this.adminService.getSettings(departmentId);
  }

  // Update system setting
  @Put('settings/:key')
  async updateSetting(
    @Request() req,
    @Param('key') key: string,
    @Body() body: { value: string },
  ) {
    this.checkAdminAccess(req.user.role);
    const departmentId = req.user.role === 'DEPT_ADMIN' ? req.user.departmentId : undefined;
    return this.adminService.updateSetting(key, body.value, req.user.id, departmentId);
  }
}

