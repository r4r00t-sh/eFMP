import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../minio/minio.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { TimingService } from '../timing/timing.service';
import { FileStatus, FilePriority, FileAction } from '@prisma/client';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private minio: MinIOService,
    private rabbitmq: RabbitMQService,
    private timing: TimingService,
  ) {}

  async createFile(data: {
    subject: string;
    description?: string;
    departmentId: string;
    divisionId?: string;
    createdById: string;
    priority?: FilePriority;
    dueDate?: Date;
    files?: { buffer: Buffer; filename: string; mimetype: string; size: number }[];
  }) {
    // Generate file number with department and division codes
    const fileNumber = await this.generateFileNumber(data.departmentId, data.divisionId);

    // Create file record first
    const file = await this.prisma.file.create({
      data: {
        fileNumber,
        subject: data.subject,
        description: data.description,
        departmentId: data.departmentId,
        currentDivisionId: data.divisionId,
        createdById: data.createdById,
        priority: data.priority || FilePriority.NORMAL,
        dueDate: data.dueDate,
        s3Bucket: this.minio.getBucketName(),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        department: true,
      },
    });

    // Upload attachments if provided
    if (data.files && data.files.length > 0) {
      const attachments = await Promise.all(
        data.files.map(async (uploadFile) => {
          const s3Key = await this.minio.uploadFile(
            uploadFile.filename,
            uploadFile.buffer,
            uploadFile.mimetype,
          );
          return {
            fileId: file.id,
            filename: uploadFile.filename,
            s3Key,
            s3Bucket: this.minio.getBucketName(),
            mimeType: uploadFile.mimetype,
            size: uploadFile.size,
            uploadedById: data.createdById,
          };
        })
      );

      await this.prisma.attachment.createMany({
        data: attachments,
      });

      // Update the main file's s3Key with the first attachment for backward compatibility
      if (attachments.length > 0) {
        await this.prisma.file.update({
          where: { id: file.id },
          data: { s3Key: attachments[0].s3Key },
        });
      }
    }

    // Calculate initial time remaining
    if (data.dueDate) {
      await this.timing.updateTimeRemaining(file.id);
    }

    // Create audit log
    await this.createAuditLog(file.id, data.createdById, 'created', 'File created');

    return file;
  }

  async addAttachment(fileId: string, userId: string, uploadFile: { buffer: Buffer; filename: string; mimetype: string; size: number }) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const s3Key = await this.minio.uploadFile(
      uploadFile.filename,
      uploadFile.buffer,
      uploadFile.mimetype,
    );

    const attachment = await this.prisma.attachment.create({
      data: {
        fileId,
        filename: uploadFile.filename,
        s3Key,
        s3Bucket: this.minio.getBucketName(),
        mimeType: uploadFile.mimetype,
        size: uploadFile.size,
        uploadedById: userId,
      },
    });

    await this.createAuditLog(fileId, userId, 'attachment_added', `Added attachment: ${uploadFile.filename}`);

    return attachment;
  }

  async deleteAttachment(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { file: true },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Delete from MinIO
    await this.minio.deleteFile(attachment.s3Key);

    // Delete from database
    await this.prisma.attachment.delete({ where: { id: attachmentId } });

    await this.createAuditLog(attachment.fileId, userId, 'attachment_deleted', `Deleted attachment: ${attachment.filename}`);

    return { message: 'Attachment deleted' };
  }

  async getAttachmentUrl(attachmentId: string): Promise<string> {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return this.minio.getFileUrl(attachment.s3Key, 3600);
  }

  async getAttachmentStream(attachmentId: string): Promise<{ stream: NodeJS.ReadableStream; filename: string; mimeType: string }> {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    
    const stream = await this.minio.getFileStream(attachment.s3Key);
    return {
      stream,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
    };
  }

  async getLegacyFileStream(s3Key: string): Promise<NodeJS.ReadableStream> {
    if (!s3Key) {
      throw new NotFoundException('File key not provided');
    }
    return this.minio.getFileStream(s3Key);
  }

  async getAllFiles(
    userId: string,
    userRole: string,
    departmentId?: string | null,
    options?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const where: any = {};
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    // Role-based filtering
    // SUPER_ADMIN sees ALL files regardless of department - no filter applied
    if (userRole === 'SUPER_ADMIN') {
      // No filtering for Super Admin - they see everything
    } else if (userRole === 'DEPT_ADMIN') {
      // Dept Admin sees all files in their department
      if (departmentId) {
        where.departmentId = departmentId;
      }
      // If no departmentId, they see nothing (shouldn't happen)
    } else if (userRole === 'APPROVAL_AUTHORITY') {
      // Approval Authority sees files in their department
      if (departmentId) {
        where.departmentId = departmentId;
      }
    } else if (userRole === 'INWARD_DESK' || userRole === 'DISPATCHER') {
      // Inward Desk and Dispatcher see files in their department
      if (departmentId) {
        where.departmentId = departmentId;
      }
    } else if (userRole === 'SECTION_OFFICER') {
      // Section Officers see files assigned to them OR created by them
      where.OR = [
        { assignedToId: userId },
        { createdById: userId },
      ];
    } else {
      // Regular users only see files assigned to them or created by them
      where.OR = [
        { assignedToId: userId },
        { createdById: userId },
      ];
    }

    // Status filter
    if (options?.status) {
      where.status = options.status;
    }

    // Search filter - need to combine with role-based OR filter properly
    if (options?.search) {
      const searchCondition = {
        OR: [
          { fileNumber: { contains: options.search, mode: 'insensitive' } },
          { subject: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ],
      };

      // If there's already an OR clause from role-based filtering, use AND to combine
      if (where.OR) {
        const existingOr = where.OR;
        delete where.OR;
        where.AND = [
          { OR: existingOr },
          searchCondition,
        ];
      } else {
        where.OR = searchCondition.OR;
      }
    }

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, username: true } },
          assignedTo: { select: { id: true, name: true, username: true } },
          department: { select: { id: true, name: true, code: true } },
          currentDivision: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      data: files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFileById(id: string, userId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        department: true,
        currentDivision: true,
        notes: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        routingHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        attachments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Get file URL if exists (backward compatibility)
    let fileUrl: string | null = null;
    if (file.s3Key) {
      fileUrl = await this.minio.getFileUrl(file.s3Key, 3600);
    }

    // Generate proxy URLs for all attachments (to avoid MinIO signature issues)
    // These URLs point to the backend proxy endpoint
    const attachmentsWithUrls = file.attachments.map((att) => ({
      ...att,
      url: `/files/attachments/${att.id}/download`,
    }));

    return {
      ...file,
      fileUrl: file.s3Key ? `/files/attachments/legacy/download?key=${encodeURIComponent(file.s3Key)}` : null,
      attachments: attachmentsWithUrls,
    };
  }

  async forwardFile(
    fileId: string,
    fromUserId: string,
    toDivisionId: string,
    toUserId: string,
    remarks?: string,
  ) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { assignedTo: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Update file assignment
    const updatedFile = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        assignedToId: toUserId,
        currentDivisionId: toDivisionId,
        status: FileStatus.IN_PROGRESS,
      },
    });

    // Create routing history
    await this.prisma.fileRouting.create({
      data: {
        fileId,
        fromUserId,
        toUserId,
        toDivisionId,
        action: FileAction.FORWARDED,
        actionString: 'forward',
        remarks,
      },
    });

    // Create audit log
    await this.createAuditLog(fileId, fromUserId, 'forward', remarks || 'File forwarded');

    // Send actionable toast to recipient
    if (toUserId) {
      await this.rabbitmq.publishToast({
        userId: toUserId,
        type: 'file_received',
        title: 'New File Assigned',
        message: `File ${file.fileNumber}: ${file.subject}`,
        fileId: file.id,
        actions: [
          { label: 'Request Extra Time', action: 'request_extra_time', payload: { fileId } },
        ],
      });
    }

    return updatedFile;
  }

  async performAction(fileId: string, userId: string, action: string, remarks?: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    let newStatus: FileStatus;
    let fileAction: FileAction;
    
    switch (action) {
      case 'approve':
        newStatus = FileStatus.APPROVED;
        fileAction = FileAction.APPROVED;
        break;
      case 'reject':
        newStatus = FileStatus.REJECTED;
        fileAction = FileAction.REJECTED;
        break;
      case 'return':
      case 'return_to_previous':
        newStatus = FileStatus.RETURNED;
        fileAction = FileAction.RETURNED_TO_PREVIOUS;
        break;
      case 'return_to_host':
        newStatus = FileStatus.RETURNED;
        fileAction = FileAction.RETURNED_TO_HOST;
        break;
      case 'hold':
        newStatus = FileStatus.ON_HOLD;
        fileAction = FileAction.ON_HOLD;
        break;
      case 'release':
        newStatus = FileStatus.IN_PROGRESS;
        fileAction = FileAction.RELEASED_FROM_HOLD;
        break;
      default:
        throw new ForbiddenException('Invalid action');
    }

    const updatedFile = await this.prisma.file.update({
      where: { id: fileId },
      data: { 
        status: newStatus,
        isOnHold: action === 'hold',
        holdReason: action === 'hold' ? remarks : null,
      },
    });

    // Create routing history
    await this.prisma.fileRouting.create({
      data: {
        fileId,
        fromUserId: userId,
        action: fileAction,
        actionString: action,
        remarks,
      },
    });

    // Create audit log
    await this.createAuditLog(fileId, userId, action, remarks || `File ${action}`);

    return updatedFile;
  }

  async requestExtraTime(fileId: string, userId: string, additionalDays: number, reason?: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { 
        createdBy: true,
        department: true,
        routingHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          where: { toUserId: userId },
        },
      },
    });

    if (!file || file.assignedToId !== userId) {
      throw new ForbiddenException('You are not assigned to this file');
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Find who sent the file to current user (the approver)
    const lastRouting = file.routingHistory[0];
    const approverId = lastRouting?.fromUserId || file.createdById;
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      select: { name: true },
    });

    const additionalTimeSeconds = additionalDays * 24 * 60 * 60;

    // Create extension request record
    const extensionRequest = await this.prisma.timeExtensionRequest.create({
      data: {
        fileId,
        requestedById: userId,
        requestedByName: requester?.name,
        reason: reason || 'Extra time needed',
        additionalTime: additionalTimeSeconds,
        approverId,
        approverName: approver?.name,
        status: 'pending',
      },
    });

    // Send toast to approver (the person who sent the file)
    await this.rabbitmq.publishToast({
      userId: approverId,
      type: 'extension_request',
      title: 'Extra Time Request',
      message: `${requester?.name || 'User'} requested ${additionalDays} additional days for file ${file.fileNumber}`,
      fileId: file.id,
      extensionReqId: extensionRequest.id,
      actions: [
        { label: 'Approve', action: 'approve_extension', payload: { extensionReqId: extensionRequest.id } },
        { label: 'Deny', action: 'deny_extension', payload: { extensionReqId: extensionRequest.id } },
      ],
    });

    // Create audit log
    await this.createAuditLog(fileId, userId, 'request_extra_time', `Requested ${additionalDays} additional days`);

    // Notify department admin and super admin
    const admins = await this.prisma.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { role: 'DEPT_ADMIN', departmentId: file.departmentId },
        ],
        isActive: true,
      },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.rabbitmq.publishToast({
        userId: admin.id,
        type: 'admin_extension_requested',
        title: 'Extension Requested',
        message: `${requester?.name || 'User'} requested extra time for file ${file.fileNumber}`,
        fileId: file.id,
      });
    }

    return { message: 'Extension request sent', extensionRequest };
  }

  async approveExtension(extensionReqId: string, userId: string, approved: boolean, remarks?: string) {
    const request = await this.prisma.timeExtensionRequest.findUnique({
      where: { id: extensionReqId },
      include: {
        file: {
          include: { department: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Extension request not found');
    }

    if (request.approverId !== userId) {
      // Check if user is admin
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || !['SUPER_ADMIN', 'DEPT_ADMIN'].includes(user.role)) {
        throw new ForbiddenException('You are not authorized to approve this request');
      }
    }

    const approver = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Update extension request
    await this.prisma.timeExtensionRequest.update({
      where: { id: extensionReqId },
      data: {
        isApproved: approved,
        approvedAt: new Date(),
        approvedById: userId,
        approvalRemarks: remarks,
        status: approved ? 'approved' : 'denied',
      },
    });

    if (approved) {
      // Extend the file's time limits
      const additionalSeconds = request.additionalTime;
      const file = request.file;
      
      const newDueDate = file.dueDate 
        ? new Date(file.dueDate.getTime() + additionalSeconds * 1000)
        : new Date(Date.now() + additionalSeconds * 1000);
      
      const newDeskDueDate = file.deskDueDate
        ? new Date(file.deskDueDate.getTime() + additionalSeconds * 1000)
        : null;

      await this.prisma.file.update({
        where: { id: file.id },
        data: {
          dueDate: newDueDate,
          deskDueDate: newDeskDueDate,
          allottedTime: (file.allottedTime || 0) + additionalSeconds,
        },
      });

      // Recalculate timer
      await this.timing.updateTimeRemaining(file.id);
    }

    // Notify requester
    await this.rabbitmq.publishToast({
      userId: request.requestedById,
      type: approved ? 'extension_approved' : 'extension_denied',
      title: approved ? 'Extra Time Approved' : 'Extra Time Denied',
      message: approved
        ? `Your extra time request for file ${request.file.fileNumber} was approved by ${approver?.name || 'Admin'}`
        : `Your extra time request for file ${request.file.fileNumber} was denied${remarks ? `: ${remarks}` : ''}`,
      fileId: request.fileId,
    });

    // Notify admins
    const admins = await this.prisma.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { role: 'DEPT_ADMIN', departmentId: request.file.departmentId },
        ],
        isActive: true,
        id: { not: userId }, // Don't notify the approver
      },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.rabbitmq.publishToast({
        userId: admin.id,
        type: `admin_extension_${approved ? 'approved' : 'denied'}`,
        title: `Extension ${approved ? 'Approved' : 'Denied'}`,
        message: `${approver?.name || 'Admin'} ${approved ? 'approved' : 'denied'} extra time for file ${request.file.fileNumber}`,
        fileId: request.fileId,
      });
    }

    // Create audit log
    await this.createAuditLog(
      request.fileId,
      userId,
      approved ? 'approve_extra_time' : 'deny_extra_time',
      remarks || `Extension ${approved ? 'approved' : 'denied'}`,
    );

    return { success: true, approved };
  }

  async getExtensionRequests(fileId: string) {
    return this.prisma.timeExtensionRequest.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingExtensionRequests(userId: string) {
    return this.prisma.timeExtensionRequest.findMany({
      where: {
        approverId: userId,
        status: 'pending',
      },
      include: {
        file: {
          select: { id: true, fileNumber: true, subject: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recallFile(fileId: string, userId: string, userRole: string, remarks?: string) {
    if (userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admin can recall files');
    }

    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const updatedFile = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        status: FileStatus.RECALLED,
        assignedToId: null,
      },
    });

    // Create routing history
    await this.prisma.fileRouting.create({
      data: {
        fileId,
        fromUserId: userId,
        action: FileAction.RECALLED,
        actionString: 'recall',
        remarks: remarks || 'File recalled by Super Admin',
      },
    });

    // Create audit log
    await this.createAuditLog(fileId, userId, 'recall', remarks || 'File recalled');

    return updatedFile;
  }

  private async generateFileNumber(departmentId: string, divisionId?: string): Promise<string> {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Get division code if provided
    let divisionCode = 'GEN'; // Default to GEN (General) if no division
    if (divisionId) {
      const division = await this.prisma.division.findUnique({
        where: { id: divisionId },
      });
      if (division) {
        divisionCode = division.code;
      }
    }

    const year = new Date().getFullYear();
    
    // Count files for this department in current year
    const count = await this.prisma.file.count({
      where: {
        departmentId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });

    // Format: DEPT-DIV-YEAR-SEQUENCE (e.g., FIN-BUD-2026-0001)
    return `${department.code}-${divisionCode}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async createAuditLog(
    fileId: string,
    userId: string,
    action: string,
    remarks: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entityType: 'File',
        entityId: fileId,
        userId,
        fileId,
        metadata: { remarks },
      },
    });
  }
}
