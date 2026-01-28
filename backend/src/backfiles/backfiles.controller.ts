import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Readable } from 'stream';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { BackFilesService } from './backfiles.service';
import { FileUploadGuard } from '../security/file-upload.guard';

@Controller('backfiles')
@UseGuards(JwtAuthGuard)
export class BackFilesController {
  constructor(private backFilesService: BackFilesService) {}

  // Create/Scan back file
  @Post()
  @UseGuards(RolesGuard, FileUploadGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_ADMIN, UserRole.SECTION_OFFICER)
  @UseInterceptors(FileInterceptor('file'))
  async createBackFile(
    @Request() req,
    @Body() body: {
      fileNumber: string;
      subject: string;
      description?: string;
      departmentId: string;
      tags?: string; // JSON string array
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let tags;
    if (body.tags) {
      try {
        tags = JSON.parse(body.tags);
      } catch {
        tags = [];
      }
    }

    return this.backFilesService.createBackFile(req.user.id, req.user.role, {
      fileNumber: body.fileNumber,
      subject: body.subject,
      description: body.description,
      departmentId: body.departmentId,
      file: file ? {
        buffer: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      } : undefined,
      tags,
    });
  }

  // Get all back files
  @Get()
  async getBackFiles(
    @Request() req,
    @Query('departmentId') departmentId?: string,
    @Query('isHidden') isHidden?: string,
    @Query('tagName') tagName?: string,
    @Query('search') search?: string,
  ) {
    return this.backFilesService.getBackFiles(req.user.id, req.user.role, {
      departmentId,
      isHidden: isHidden === 'true' ? true : isHidden === 'false' ? false : undefined,
      tagName,
      search,
    });
  }

  // Get back file by ID
  @Get(':id')
  async getBackFileById(@Param('id') id: string, @Request() req) {
    return this.backFilesService.getBackFileById(id, req.user.id, req.user.role);
  }

  // Get back files for a file
  @Get('file/:fileId')
  async getBackFilesForFile(@Param('fileId') fileId: string, @Request() req) {
    return this.backFilesService.getBackFilesForFile(fileId, req.user.id, req.user.role);
  }

  // Link back file to file
  @Post('link')
  async linkBackFile(
    @Request() req,
    @Body() body: { fileId: string; backFileId: string; linkReason?: string },
  ) {
    return this.backFilesService.linkBackFileToFile(
      req.user.id,
      body.fileId,
      body.backFileId,
      body.linkReason,
    );
  }

  // Unlink back file from file
  @Delete('link')
  async unlinkBackFile(
    @Body() body: { fileId: string; backFileId: string },
  ) {
    return this.backFilesService.unlinkBackFile(body.fileId, body.backFileId);
  }

  // Update back file access
  @Patch(':id/access')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_ADMIN)
  async updateAccess(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { isHidden?: boolean; accessRoles?: string[] },
  ) {
    return this.backFilesService.updateBackFileAccess(id, req.user.id, req.user.role, body);
  }

  // Add tag
  @Post(':id/tags')
  async addTag(
    @Param('id') backFileId: string,
    @Body() body: { tagName: string; tagValue?: string },
  ) {
    return this.backFilesService.addTag(backFileId, body.tagName, body.tagValue);
  }

  // Remove tag
  @Delete('tags/:tagId')
  async removeTag(@Param('tagId') tagId: string) {
    return this.backFilesService.removeTag(tagId);
  }

  // Download back file
  @Get(':id/download')
  async downloadBackFile(
    @Param('id') id: string,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, filename, mimeType } = await this.backFilesService.downloadBackFile(
      id,
      req.user.id,
      req.user.role,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    });

    return new StreamableFile(stream as unknown as Readable);
  }
}

