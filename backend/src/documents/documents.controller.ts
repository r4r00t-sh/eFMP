import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
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
import { DocumentsService } from './documents.service';
import { FileUploadGuard } from '../security/file-upload.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  // ============================================
  // VERSION CONTROL ENDPOINTS
  // ============================================

  // Upload new version
  @Post('attachments/:id/versions')
  @UseGuards(FileUploadGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadNewVersion(
    @Param('id') attachmentId: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('changeDescription') changeDescription?: string,
  ) {
    return this.documentsService.uploadNewVersion(
      attachmentId,
      req.user.id,
      {
        buffer: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      changeDescription,
    );
  }

  // Get all versions of an attachment
  @Get('attachments/:id/versions')
  async getAttachmentVersions(@Param('id') attachmentId: string) {
    return this.documentsService.getAttachmentVersions(attachmentId);
  }

  // Download a specific version
  @Get('versions/:id/download')
  async downloadVersion(
    @Param('id') versionId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, filename, mimeType, size } =
      await this.documentsService.getVersionDownloadStream(versionId);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': size,
    });

    return new StreamableFile(stream as unknown as Readable);
  }

  // Restore a previous version
  @Post('versions/:id/restore')
  async restoreVersion(@Param('id') versionId: string, @Request() req) {
    return this.documentsService.restoreVersion(versionId, req.user.id);
  }

  // Compare two versions
  @Get('versions/compare')
  async compareVersions(
    @Query('v1') versionId1: string,
    @Query('v2') versionId2: string,
  ) {
    return this.documentsService.compareVersions(versionId1, versionId2);
  }

  // ============================================
  // QR CODE ENDPOINTS
  // ============================================

  // Generate QR code for a file
  @Post('files/:id/qrcode')
  async generateQRCode(@Param('id') fileId: string, @Request() req) {
    return this.documentsService.generateFileQRCode(fileId, req.user.id);
  }

  // Get QR code image
  @Get('qr/:id/image')
  async getQRCodeImage(
    @Param('id') qrCodeId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, mimeType } =
      await this.documentsService.getQRCodeImage(qrCodeId);

    res.set({
      'Content-Type': mimeType,
    });

    return new StreamableFile(stream as unknown as Readable);
  }

  // Scan QR code
  @Post('qr/scan')
  async scanQRCode(
    @Request() req,
    @Body()
    body: {
      qrCodeData: string;
      location?: string;
      department?: string;
      division?: string;
      remarks?: string;
    },
  ) {
    return this.documentsService.scanQRCode(body.qrCodeData, req.user.id, {
      location: body.location,
      department: body.department,
      division: body.division,
      remarks: body.remarks,
    });
  }

  // Get scan history for a file
  @Get('files/:id/scan-history')
  async getFileScanHistory(@Param('id') fileId: string) {
    return this.documentsService.getFileScanHistory(fileId);
  }

  // ============================================
  // TEMPLATE ENDPOINTS
  // ============================================

  // Create template (Admin only)
  @Post('templates')
  @UseGuards(RolesGuard, FileUploadGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_ADMIN)
  @UseInterceptors(FileInterceptor('templateFile'))
  async createTemplate(
    @Request() req,
    @Body()
    body: {
      name: string;
      code: string;
      description?: string;
      category: string;
      defaultSubject?: string;
      defaultDescription?: string;
      defaultPriority?: string;
      defaultPriorityCategory?: string;
      defaultDueDays?: string;
      isPublic?: string;
    },
    @UploadedFile() templateFile?: Express.Multer.File,
  ) {
    return this.documentsService.createTemplate(
      req.user.id,
      {
        ...body,
        defaultDueDays: body.defaultDueDays
          ? parseInt(body.defaultDueDays)
          : undefined,
        isPublic: body.isPublic === 'true',
        departmentId:
          (req.user.roles ?? []).includes(UserRole.DEPT_ADMIN)
            ? req.user.departmentId
            : undefined,
      },
      templateFile
        ? {
            buffer: templateFile.buffer,
            filename: templateFile.originalname,
            mimetype: templateFile.mimetype,
          }
        : undefined,
    );
  }

  // Get all templates
  @Get('templates')
  async getTemplates(@Request() req, @Query('category') category?: string) {
    return this.documentsService.getTemplates(req.user.departmentId, category);
  }

  // Get template by ID
  @Get('templates/:id')
  async getTemplateById(@Param('id') id: string) {
    return this.documentsService.getTemplateById(id);
  }

  // Update template
  @Patch('templates/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_ADMIN)
  async updateTemplate(
    @Param('id') id: string,
    @Request() req,
    @Body()
    body: {
      name?: string;
      description?: string;
      category?: string;
      defaultSubject?: string;
      defaultDescription?: string;
      defaultPriority?: string;
      defaultPriorityCategory?: string;
      defaultDueDays?: number;
      isActive?: boolean;
      isPublic?: boolean;
    },
  ) {
    return this.documentsService.updateTemplate(id, req.user.id, body);
  }

  // Delete template
  @Delete('templates/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.DEPT_ADMIN)
  async deleteTemplate(@Param('id') id: string) {
    return this.documentsService.deleteTemplate(id);
  }

  // Get template categories
  @Get('templates-categories')
  async getTemplateCategories() {
    return this.documentsService.getTemplateCategories();
  }
}
