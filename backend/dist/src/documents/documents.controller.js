"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const documents_service_1 = require("./documents.service");
const file_upload_guard_1 = require("../security/file-upload.guard");
let DocumentsController = class DocumentsController {
    documentsService;
    constructor(documentsService) {
        this.documentsService = documentsService;
    }
    async uploadNewVersion(attachmentId, req, file, changeDescription) {
        return this.documentsService.uploadNewVersion(attachmentId, req.user.id, {
            buffer: file.buffer,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        }, changeDescription);
    }
    async getAttachmentVersions(attachmentId) {
        return this.documentsService.getAttachmentVersions(attachmentId);
    }
    async downloadVersion(versionId, res) {
        const { stream, filename, mimeType, size } = await this.documentsService.getVersionDownloadStream(versionId);
        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'Content-Length': size,
        });
        return new common_1.StreamableFile(stream);
    }
    async restoreVersion(versionId, req) {
        return this.documentsService.restoreVersion(versionId, req.user.id);
    }
    async compareVersions(versionId1, versionId2) {
        return this.documentsService.compareVersions(versionId1, versionId2);
    }
    async generateQRCode(fileId, req) {
        return this.documentsService.generateFileQRCode(fileId, req.user.id);
    }
    async getQRCodeImage(qrCodeId, res) {
        const { stream, mimeType } = await this.documentsService.getQRCodeImage(qrCodeId);
        res.set({
            'Content-Type': mimeType,
        });
        return new common_1.StreamableFile(stream);
    }
    async scanQRCode(req, body) {
        return this.documentsService.scanQRCode(body.qrCodeData, req.user.id, {
            location: body.location,
            department: body.department,
            division: body.division,
            remarks: body.remarks,
        });
    }
    async getFileScanHistory(fileId) {
        return this.documentsService.getFileScanHistory(fileId);
    }
    async createTemplate(req, body, templateFile) {
        return this.documentsService.createTemplate(req.user.id, {
            ...body,
            defaultDueDays: body.defaultDueDays ? parseInt(body.defaultDueDays) : undefined,
            isPublic: body.isPublic === 'true',
            departmentId: req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined,
        }, templateFile ? {
            buffer: templateFile.buffer,
            filename: templateFile.originalname,
            mimetype: templateFile.mimetype,
        } : undefined);
    }
    async getTemplates(req, category) {
        return this.documentsService.getTemplates(req.user.departmentId, category);
    }
    async getTemplateById(id) {
        return this.documentsService.getTemplateById(id);
    }
    async updateTemplate(id, req, body) {
        return this.documentsService.updateTemplate(id, req.user.id, body);
    }
    async deleteTemplate(id) {
        return this.documentsService.deleteTemplate(id);
    }
    async getTemplateCategories() {
        return this.documentsService.getTemplateCategories();
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Post)('attachments/:id/versions'),
    (0, common_1.UseGuards)(file_upload_guard_1.FileUploadGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Body)('changeDescription')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "uploadNewVersion", null);
__decorate([
    (0, common_1.Get)('attachments/:id/versions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "getAttachmentVersions", null);
__decorate([
    (0, common_1.Get)('versions/:id/download'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "downloadVersion", null);
__decorate([
    (0, common_1.Post)('versions/:id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "restoreVersion", null);
__decorate([
    (0, common_1.Get)('versions/compare'),
    __param(0, (0, common_1.Query)('v1')),
    __param(1, (0, common_1.Query)('v2')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "compareVersions", null);
__decorate([
    (0, common_1.Post)('files/:id/qrcode'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "generateQRCode", null);
__decorate([
    (0, common_1.Get)('qr/:id/image'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "getQRCodeImage", null);
__decorate([
    (0, common_1.Post)('qr/scan'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "scanQRCode", null);
__decorate([
    (0, common_1.Get)('files/:id/scan-history'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "getFileScanHistory", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard, file_upload_guard_1.FileUploadGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('templateFile')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "getTemplateById", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Get)('templates-categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "getTemplateCategories", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, common_1.Controller)('documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map