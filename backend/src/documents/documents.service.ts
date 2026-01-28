import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../minio/minio.service';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private minio: MinIOService,
  ) {}

  // ============================================
  // VERSION CONTROL
  // ============================================

  // Upload new version of an attachment
  async uploadNewVersion(
    attachmentId: string,
    userId: string,
    file: {
      buffer: Buffer;
      filename: string;
      mimetype: string;
      size: number;
    },
    changeDescription?: string,
  ) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { file: true },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check if user can modify
    if (attachment.file.assignedToId !== userId && attachment.file.createdById !== userId) {
      throw new ForbiddenException('You are not authorized to upload new versions');
    }

    // Get current version number
    const latestVersion = await this.prisma.attachmentVersion.findFirst({
      where: { originalAttachmentId: attachmentId },
      orderBy: { versionNumber: 'desc' },
    });

    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 2;

    // First, save current version to version history
    if (!latestVersion) {
      // Save v1 (the original attachment)
      await this.prisma.attachmentVersion.create({
        data: {
          attachmentId: attachment.id,
          originalAttachmentId: attachment.id,
          versionNumber: 1,
          filename: attachment.filename,
          s3Key: attachment.s3Key,
          s3Bucket: attachment.s3Bucket,
          mimeType: attachment.mimeType,
          size: attachment.size,
          uploadedById: attachment.uploadedById || userId,
          changeDescription: 'Original version',
          isLatest: false,
          checksum: await this.calculateChecksum(attachment.s3Key, attachment.s3Bucket),
        },
      });
    } else {
      // Mark previous latest as not latest
      await this.prisma.attachmentVersion.updateMany({
        where: { originalAttachmentId: attachmentId, isLatest: true },
        data: { isLatest: false },
      });
    }

    // Upload new file to MinIO
    const s3Key = `files/${attachment.fileId}/attachments/${Date.now()}-${file.filename}`;
    await this.minio.uploadFile(s3Key, file.buffer, file.mimetype);

    // Calculate checksum
    const checksum = crypto.createHash('md5').update(file.buffer).digest('hex');

    // Create new version record
    const newVersion = await this.prisma.attachmentVersion.create({
      data: {
        attachmentId: attachment.id,
        originalAttachmentId: attachmentId,
        versionNumber: newVersionNumber,
        filename: file.filename,
        s3Key,
        s3Bucket: 'efiling',
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userId,
        changeDescription,
        isLatest: true,
        checksum,
      },
    });

    // Update the main attachment to point to new version
    await this.prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        filename: file.filename,
        s3Key,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'ATTACHMENT_VERSION_UPLOADED',
        entityType: 'Attachment',
        entityId: attachmentId,
        userId,
        fileId: attachment.fileId,
        metadata: {
          versionNumber: newVersionNumber,
          filename: file.filename,
          changeDescription,
        },
      },
    });

    return {
      attachment,
      newVersion,
      message: `Version ${newVersionNumber} uploaded successfully`,
    };
  }

  // Get all versions of an attachment
  async getAttachmentVersions(attachmentId: string) {
    const versions = await this.prisma.attachmentVersion.findMany({
      where: { originalAttachmentId: attachmentId },
      orderBy: { versionNumber: 'desc' },
    });

    return versions.map(v => ({
      ...v,
      downloadUrl: `/documents/versions/${v.id}/download`,
    }));
  }

  // Download a specific version
  async getVersionDownloadStream(versionId: string) {
    const version = await this.prisma.attachmentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    const stream = await this.minio.getFileStream(version.s3Key);
    return {
      stream,
      filename: version.filename,
      mimeType: version.mimeType,
      size: version.size,
    };
  }

  // Restore a previous version
  async restoreVersion(versionId: string, userId: string) {
    const version = await this.prisma.attachmentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    const attachment = await this.prisma.attachment.findUnique({
      where: { id: version.attachmentId },
      include: { file: true },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Check authorization
    if (attachment.file.assignedToId !== userId && attachment.file.createdById !== userId) {
      throw new ForbiddenException('You are not authorized to restore versions');
    }

    // Mark all versions as not latest
    await this.prisma.attachmentVersion.updateMany({
      where: { originalAttachmentId: version.originalAttachmentId },
      data: { isLatest: false },
    });

    // Mark this version as latest
    await this.prisma.attachmentVersion.update({
      where: { id: versionId },
      data: { isLatest: true },
    });

    // Update the main attachment
    await this.prisma.attachment.update({
      where: { id: version.attachmentId },
      data: {
        filename: version.filename,
        s3Key: version.s3Key,
        mimeType: version.mimeType,
        size: version.size,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'ATTACHMENT_VERSION_RESTORED',
        entityType: 'Attachment',
        entityId: version.attachmentId,
        userId,
        fileId: attachment.fileId,
        metadata: {
          restoredVersionNumber: version.versionNumber,
        },
      },
    });

    return { message: `Restored to version ${version.versionNumber}` };
  }

  // Compare two versions
  async compareVersions(versionId1: string, versionId2: string) {
    const [v1, v2] = await Promise.all([
      this.prisma.attachmentVersion.findUnique({ where: { id: versionId1 } }),
      this.prisma.attachmentVersion.findUnique({ where: { id: versionId2 } }),
    ]);

    if (!v1 || !v2) {
      throw new NotFoundException('One or both versions not found');
    }

    return {
      version1: {
        versionNumber: v1.versionNumber,
        filename: v1.filename,
        size: v1.size,
        mimeType: v1.mimeType,
        uploadedAt: v1.createdAt,
        changeDescription: v1.changeDescription,
      },
      version2: {
        versionNumber: v2.versionNumber,
        filename: v2.filename,
        size: v2.size,
        mimeType: v2.mimeType,
        uploadedAt: v2.createdAt,
        changeDescription: v2.changeDescription,
      },
      differences: {
        filenameChanged: v1.filename !== v2.filename,
        sizeChange: v2.size - v1.size,
        mimeTypeChanged: v1.mimeType !== v2.mimeType,
      },
    };
  }

  // ============================================
  // QR CODE GENERATION & TRACKING
  // ============================================

  // Generate QR code for a file
  async generateFileQRCode(fileId: string, userId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check if QR code already exists
    let qrCode = await this.prisma.fileQRCode.findUnique({
      where: { fileId },
    });

    if (qrCode) {
      return {
        qrCode,
        imageUrl: `/documents/qr/${qrCode.id}/image`,
      };
    }

    // Generate unique QR code data
    const qrCodeData = `EFILING-${file.fileNumber}-${Date.now()}`;

    // Generate QR code image
    const qrImageBuffer = await QRCode.toBuffer(qrCodeData, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    // Upload QR code image to MinIO
    const qrImageKey = `qrcodes/${fileId}-qr.png`;
    await this.minio.uploadFile(qrImageKey, qrImageBuffer, 'image/png');

    // Create QR code record
    qrCode = await this.prisma.fileQRCode.create({
      data: {
        fileId,
        qrCodeData,
        qrCodeImageKey: qrImageKey,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'QR_CODE_GENERATED',
        entityType: 'File',
        entityId: fileId,
        userId,
        fileId,
        metadata: { qrCodeData },
      },
    });

    return {
      qrCode,
      imageUrl: `/documents/qr/${qrCode.id}/image`,
    };
  }

  // Get QR code image
  async getQRCodeImage(qrCodeId: string) {
    const qrCode = await this.prisma.fileQRCode.findUnique({
      where: { id: qrCodeId },
    });

    if (!qrCode || !qrCode.qrCodeImageKey) {
      throw new NotFoundException('QR code not found');
    }

    const stream = await this.minio.getFileStream(qrCode.qrCodeImageKey);
    return { stream, mimeType: 'image/png' };
  }

  // Scan QR code (log physical file movement)
  async scanQRCode(
    qrCodeData: string,
    userId: string,
    data: {
      location?: string;
      department?: string;
      division?: string;
      remarks?: string;
    },
  ) {
    // Find the file by QR code
    const qrCode = await this.prisma.fileQRCode.findFirst({
      where: { qrCodeData },
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not recognized');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Log the scan
    await this.prisma.qRCodeScanLog.create({
      data: {
        qrCodeData,
        fileId: qrCode.fileId,
        scannedById: userId,
        scannedByName: user?.name,
        location: data.location,
        department: data.department,
        division: data.division,
        remarks: data.remarks,
      },
    });

    // Update QR code scan tracking
    await this.prisma.fileQRCode.update({
      where: { id: qrCode.id },
      data: {
        lastScannedAt: new Date(),
        lastScannedById: userId,
        scanCount: { increment: 1 },
      },
    });

    // Get file details
    const file = await this.prisma.file.findUnique({
      where: { id: qrCode.fileId },
      include: {
        department: { select: { name: true } },
        currentDivision: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    });

    return {
      success: true,
      file: {
        id: file?.id,
        fileNumber: file?.fileNumber,
        subject: file?.subject,
        status: file?.status,
        department: file?.department.name,
        division: file?.currentDivision?.name,
        assignedTo: file?.assignedTo?.name,
      },
      message: 'QR code scanned successfully',
    };
  }

  // Get scan history for a file
  async getFileScanHistory(fileId: string) {
    const qrCode = await this.prisma.fileQRCode.findUnique({
      where: { fileId },
    });

    if (!qrCode) {
      return { scans: [], totalScans: 0 };
    }

    const scans = await this.prisma.qRCodeScanLog.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      qrCode: {
        id: qrCode.id,
        qrCodeData: qrCode.qrCodeData,
        scanCount: qrCode.scanCount,
        lastScannedAt: qrCode.lastScannedAt,
      },
      scans,
      totalScans: scans.length,
    };
  }

  // ============================================
  // FILE TEMPLATES
  // ============================================

  // Create a file template
  async createTemplate(
    userId: string,
    data: {
      name: string;
      code: string;
      description?: string;
      category: string;
      defaultSubject?: string;
      defaultDescription?: string;
      defaultPriority?: string;
      defaultPriorityCategory?: string;
      defaultDueDays?: number;
      defaultDepartmentId?: string;
      defaultDivisionId?: string;
      isPublic?: boolean;
      departmentId?: string;
    },
    templateFile?: {
      buffer: Buffer;
      filename: string;
      mimetype: string;
    },
  ) {
    let templateS3Key: string | undefined;

    if (templateFile) {
      templateS3Key = `templates/${data.code}/${templateFile.filename}`;
      await this.minio.uploadFile(templateS3Key, templateFile.buffer, templateFile.mimetype);
    }

    const template = await this.prisma.fileTemplate.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        category: data.category,
        defaultSubject: data.defaultSubject,
        defaultDescription: data.defaultDescription,
        defaultPriority: data.defaultPriority as any || 'NORMAL',
        defaultPriorityCategory: data.defaultPriorityCategory as any || 'ROUTINE',
        defaultDueDays: data.defaultDueDays,
        defaultDepartmentId: data.defaultDepartmentId,
        defaultDivisionId: data.defaultDivisionId,
        templateS3Key,
        templateS3Bucket: templateS3Key ? 'efiling' : undefined,
        templateFilename: templateFile?.filename,
        templateMimeType: templateFile?.mimetype,
        isPublic: data.isPublic ?? true,
        departmentId: data.departmentId,
        createdById: userId,
      },
    });

    return template;
  }

  // Get all templates
  async getTemplates(departmentId?: string, category?: string) {
    const where: any = { isActive: true };

    if (departmentId) {
      where.OR = [
        { isPublic: true },
        { departmentId },
      ];
    } else {
      where.isPublic = true;
    }

    if (category) {
      where.category = category;
    }

    return this.prisma.fileTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  // Get template by ID
  async getTemplateById(id: string) {
    const template = await this.prisma.fileTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  // Update template
  async updateTemplate(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      category: string;
      defaultSubject: string;
      defaultDescription: string;
      defaultPriority: string;
      defaultPriorityCategory: string;
      defaultDueDays: number;
      isActive: boolean;
      isPublic: boolean;
    }>,
  ) {
    return this.prisma.fileTemplate.update({
      where: { id },
      data: {
        ...data,
        defaultPriority: data.defaultPriority as any,
        defaultPriorityCategory: data.defaultPriorityCategory as any,
      },
    });
  }

  // Delete template
  async deleteTemplate(id: string) {
    return this.prisma.fileTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Get template categories
  async getTemplateCategories() {
    const categories = await this.prisma.fileTemplate.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true },
    });

    return categories.map(c => ({
      category: c.category,
      count: c._count.id,
    }));
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async calculateChecksum(s3Key: string, bucket: string): Promise<string | null> {
    try {
      const stream = await this.minio.getFileStream(s3Key);
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        stream.on('data', (data: Buffer) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      });
    } catch {
      return null;
    }
  }
}

