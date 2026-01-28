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
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const files_service_1 = require("./files.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const file_upload_guard_1 = require("../security/file-upload.guard");
let FilesController = class FilesController {
    filesService;
    constructor(filesService) {
        this.filesService = filesService;
    }
    async createFile(req, body, files) {
        return this.filesService.createFile({
            ...body,
            createdById: req.user.id,
            divisionId: body.divisionId,
            priority: body.priority,
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
            files: files?.map(file => ({
                buffer: file.buffer,
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
            })),
        });
    }
    async getAllFiles(req, status, search, page, limit) {
        return this.filesService.getAllFiles(req.user.id, req.user.role, req.user.departmentId, {
            status,
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }
    async getFile(id, req) {
        return this.filesService.getFileById(id, req.user.id);
    }
    async addAttachments(id, req, files) {
        const results = await Promise.all(files.map(file => this.filesService.addAttachment(id, req.user.id, {
            buffer: file.buffer,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        })));
        return { attachments: results };
    }
    async getAttachmentUrl(attachmentId) {
        const url = await this.filesService.getAttachmentUrl(attachmentId);
        return { url };
    }
    async deleteAttachment(attachmentId, req) {
        return this.filesService.deleteAttachment(attachmentId, req.user.id);
    }
    async forwardFile(id, req, body) {
        return this.filesService.forwardFile(id, req.user.id, body.toDivisionId, body.toUserId, body.remarks);
    }
    async performAction(id, req, body) {
        return this.filesService.performAction(id, req.user.id, body.action, body.remarks);
    }
    async requestExtraTime(id, req, body) {
        return this.filesService.requestExtraTime(id, req.user.id, body.additionalDays, body.reason);
    }
    async getExtensionRequests(id) {
        return this.filesService.getExtensionRequests(id);
    }
    async getPendingExtensionRequests(req) {
        return this.filesService.getPendingExtensionRequests(req.user.id);
    }
    async approveExtension(requestId, req, body) {
        return this.filesService.approveExtension(requestId, req.user.id, true, body.remarks);
    }
    async denyExtension(requestId, req, body) {
        return this.filesService.approveExtension(requestId, req.user.id, false, body.remarks);
    }
    async recallFile(id, req, body) {
        return this.filesService.recallFile(id, req.user.id, req.user.role, body.remarks);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(file_upload_guard_1.FileUploadGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Array]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "createFile", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getAllFiles", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getFile", null);
__decorate([
    (0, common_1.Post)(':id/attachments'),
    (0, common_1.UseGuards)(file_upload_guard_1.FileUploadGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Array]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "addAttachments", null);
__decorate([
    (0, common_1.Get)('attachments/:attachmentId/url'),
    __param(0, (0, common_1.Param)('attachmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getAttachmentUrl", null);
__decorate([
    (0, common_1.Delete)('attachments/:attachmentId'),
    __param(0, (0, common_1.Param)('attachmentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "deleteAttachment", null);
__decorate([
    (0, common_1.Post)(':id/forward'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "forwardFile", null);
__decorate([
    (0, common_1.Post)(':id/action'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "performAction", null);
__decorate([
    (0, common_1.Post)(':id/request-extra-time'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "requestExtraTime", null);
__decorate([
    (0, common_1.Get)(':id/extension-requests'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getExtensionRequests", null);
__decorate([
    (0, common_1.Get)('extension-requests/pending'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getPendingExtensionRequests", null);
__decorate([
    (0, common_1.Post)('extension-requests/:requestId/approve'),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "approveExtension", null);
__decorate([
    (0, common_1.Post)('extension-requests/:requestId/deny'),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "denyExtension", null);
__decorate([
    (0, common_1.Post)(':id/recall'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "recallFile", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map