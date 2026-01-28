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
exports.OpinionsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const opinions_service_1 = require("./opinions.service");
const file_upload_guard_1 = require("../security/file-upload.guard");
let OpinionsController = class OpinionsController {
    opinionsService;
    constructor(opinionsService) {
        this.opinionsService = opinionsService;
    }
    async requestOpinion(req, body) {
        return this.opinionsService.requestOpinion(body.fileId, req.user.id, {
            requestedToDepartmentId: body.requestedToDepartmentId,
            requestedToDivisionId: body.requestedToDivisionId,
            requestedToUserId: body.requestedToUserId,
            requestReason: body.requestReason,
            specialPermissionGranted: body.specialPermissionGranted,
        });
    }
    async getPendingOpinions(req) {
        return this.opinionsService.getPendingOpinions(req.user.id, req.user.departmentId);
    }
    async getFileForOpinion(opinionRequestId, req) {
        return this.opinionsService.getFileForOpinion(opinionRequestId, req.user.id);
    }
    async addOpinionNote(opinionRequestId, req, body) {
        return this.opinionsService.addOpinionNote(opinionRequestId, req.user.id, body.content);
    }
    async provideOpinion(opinionRequestId, req, body, files) {
        return this.opinionsService.provideOpinion(opinionRequestId, req.user.id, {
            opinionNote: body.opinionNote,
            attachmentFiles: files?.map(file => ({
                buffer: file.buffer,
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
            })),
        });
    }
    async returnOpinion(opinionRequestId, req) {
        return this.opinionsService.returnOpinion(opinionRequestId, req.user.id);
    }
};
exports.OpinionsController = OpinionsController;
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OpinionsController.prototype, "requestOpinion", null);
__decorate([
    (0, common_1.Get)('pending'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OpinionsController.prototype, "getPendingOpinions", null);
__decorate([
    (0, common_1.Get)('requests/:id/file'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OpinionsController.prototype, "getFileForOpinion", null);
__decorate([
    (0, common_1.Post)('requests/:id/notes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OpinionsController.prototype, "addOpinionNote", null);
__decorate([
    (0, common_1.Post)('requests/:id/provide'),
    (0, common_1.UseGuards)(file_upload_guard_1.FileUploadGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Array]),
    __metadata("design:returntype", Promise)
], OpinionsController.prototype, "provideOpinion", null);
__decorate([
    (0, common_1.Post)('requests/:id/return'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OpinionsController.prototype, "returnOpinion", null);
exports.OpinionsController = OpinionsController = __decorate([
    (0, common_1.Controller)('opinions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [opinions_service_1.OpinionsService])
], OpinionsController);
//# sourceMappingURL=opinions.controller.js.map