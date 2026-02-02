import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversations')
  async listConversations(@Request() req: any) {
    return this.chatService.listConversations(req.user.id);
  }

  @Get('conversations/:id')
  async getConversation(@Request() req: any, @Param('id') id: string) {
    return this.chatService.getConversation(id, req.user.id);
  }

  @Post('dm/:otherUserId')
  async getOrCreateDm(
    @Request() req: any,
    @Param('otherUserId') otherUserId: string,
  ) {
    return this.chatService.getOrCreateDm(req.user.id, otherUserId);
  }

  @Post('groups')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_ADMIN, UserRole.CHAT_MANAGER)
  async createGroup(@Request() req: any, @Body() dto: CreateGroupDto) {
    return this.chatService.createGroup(req.user.id, req.user.roles ?? [], {
      name: dto.name,
      description: dto.description,
      departmentId: dto.departmentId,
      memberIds: dto.memberIds,
    });
  }

  @Post('conversations/:id/members')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_ADMIN, UserRole.CHAT_MANAGER)
  async addMembers(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.chatService.addMembers(
      id,
      req.user.id,
      req.user.roles ?? [],
      dto.userIds,
    );
  }

  @Post('conversations/:id/members/:userId/remove')
  async removeMember(
    @Request() req: any,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.chatService.removeMember(
      id,
      req.user.id,
      req.user.roles ?? [],
      targetUserId,
    );
    return { success: true };
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Request() req: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      id,
      req.user.id,
      cursor,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(id, req.user.id, dto.content);
  }

  @Post('conversations/:id/read')
  async markRead(
    @Request() req: any,
    @Param('id') id: string,
    @Body('messageId') messageId?: string,
  ) {
    return this.chatService.markRead(id, req.user.id, messageId);
  }

  @Get('users')
  async listUsers(
    @Request() req: any,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    return this.chatService.listUsersForChat(req.user.id, departmentId, search);
  }

  @Get('conversations/:id/export')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_ADMIN, UserRole.CHAT_MANAGER)
  async exportMessages(
    @Request() req: any,
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.chatService.exportConversationMessages(
      id,
      req.user.id,
      req.user.roles ?? [],
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_ADMIN, UserRole.CHAT_MANAGER)
  async getChatStatistics(
    @Request() req: any,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.chatService.getChatStatistics(req.user.roles ?? [], departmentId);
  }
}
