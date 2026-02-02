import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('files/:fileId/notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async createNote(
    @Param('fileId') fileId: string,
    @Request() req,
    @Body() body: { content: string },
  ) {
    return this.prisma.note.create({
      data: {
        fileId,
        userId: req.user.id,
        content: body.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
