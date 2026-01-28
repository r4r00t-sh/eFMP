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
exports.BackFilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const backfiles_service_1 = require("./backfiles.service");
const file_upload_guard_1 = require("../security/file-upload.guard");
let BackFilesController = class BackFilesController {
    backFilesService;
    constructor(backFilesService) {
        this.backFilesService = backFilesService;
    }
    async createBackFile(req, body, file) {
        let tags;
        if (body.tags) {
            try {
                tags = JSON.parse(body.tags);
            }
            catch {
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
    async getBackFiles(req, departmentId, isHidden, tagName, search) {
        return this.backFilesService.getBackFiles(req.user.id, req.user.role, {
            departmentId,
            isHidden: isHidden === 'true' ? true : isHidden === 'false' ? false : undefined,
            tagName,
            search,
        });
    }
    async getBackFileById(id, req) {
        return this.backFilesService.getBackFileById(id, req.user.id, req.user.role);
    }
    async getBackFilesForFile(fileId, req) {
        return this.backFilesService.getBackFilesForFile(fileId, req.user.id, req.user.role);
    }
    async linkBackFile(req, body) {
        return this.backFilesService.linkBackFileToFile(req.user.id, body.fileId, body.backFileId, body.linkReason);
    }
    async unlinkBackFile(body) {
        return this.backFilesService.unlinkBackFile(body.fileId, body.backFileId);
    }
    async updateAccess(id, req, body) {
        return this.backFilesService.updateBackFileAccess(id, req.user.id, req.user.role, body);
    }
    async addTag(backFileId, body) {
        return this.backFilesService.addTag(backFileId, body.tagName, body.tagValue);
    }
    async removeTag(tagId) {
        return this.backFilesService.removeTag(tagId);
    }
    async downloadBackFile(id, req, res) {
        const { stream, filename, mimeType } = await this.backFilesService.downloadBackFile(id, req.user.id, req.user.role);
        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        });
        return new common_1.StreamableFile(stream);
    }
};
exports.BackFilesController = BackFilesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard, file_upload_guard_1.FileUploadGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN, client_1.UserRole.SECTION_OFFICER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], BackFilesController.prototype, "createBackFile", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('departmentId')),
    __param(2, (0, common_1.Query)('isHidden')),
    __param(3, (0, common_1.Query)('tagName')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BackFilesController.prototype, "getBackFiles", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BackFilesController.prototype, "getBackFileById", null);
__decorate([
    (0, common_1.Get)('file/:fileId'),
    __param(0, (0, common_1.Param)('fileId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BackFilesController.prototype, "getBackFilesForFile", null);
__decorate([
    (0, common_1.Post)('link'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BackFilesController.prototype, "linkBackFile", null);
__decorate([
    (0, common_1.Delete)('link'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BackFilesController.prototype, "unlinkBackFile", null);
__decorate([
    (0, common_1.Patch)(':id/access'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BackFilesController.prototype, "updateAccess", null);
__decorate([
    (0, common_1.Post)(':id/tags'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BackFilesController.prototype, "addTag", null);
__decorate([
    (0, common_1.Delete)('tags/:tagId'),
    __param(0, (0, common_1.Param)('tagId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BackFilesController.prototype, "removeTag", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BackFilesController.prototype, "downloadBackFile", null);
exports.BackFilesController = BackFilesController = __decorate([
    (0, common_1.Controller)('backfiles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [backfiles_service_1.BackFilesService])
], BackFilesController);
//# sourceMappingURL=backfiles.controller.js.map