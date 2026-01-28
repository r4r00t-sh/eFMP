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
exports.DispatchController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const dispatch_service_1 = require("./dispatch.service");
let DispatchController = class DispatchController {
    dispatchService;
    constructor(dispatchService) {
        this.dispatchService = dispatchService;
    }
    async prepareForDispatch(req, body) {
        return this.dispatchService.prepareForDispatch(body.fileId, req.user.id, req.user.role, body.remarks);
    }
    async dispatchFile(req, body, proofDocument) {
        return this.dispatchService.dispatchFile(body.fileId, req.user.id, {
            ...body,
            proofDocument: proofDocument ? {
                buffer: proofDocument.buffer,
                filename: proofDocument.originalname,
                mimetype: proofDocument.mimetype,
                size: proofDocument.size,
            } : undefined,
        });
    }
    async getDispatchProof(fileId) {
        return this.dispatchService.getDispatchProof(fileId);
    }
    async getDispatchProofs(req, dateFrom, dateTo) {
        const departmentId = req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined;
        return this.dispatchService.getDispatchProofs(departmentId, dateFrom ? new Date(dateFrom) : undefined, dateTo ? new Date(dateTo) : undefined);
    }
    async downloadDispatchDocument(dispatchProofId, documentType, res) {
        const { stream, filename } = await this.dispatchService.getDispatchProofDocument(dispatchProofId, documentType);
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        });
        return new common_1.StreamableFile(stream);
    }
};
exports.DispatchController = DispatchController;
__decorate([
    (0, common_1.Post)('prepare'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN, client_1.UserRole.DISPATCHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "prepareForDispatch", null);
__decorate([
    (0, common_1.Post)('dispatch'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard, FileUploadGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.DISPATCHER, client_1.UserRole.SUPER_ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('proofDocument')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "dispatchFile", null);
__decorate([
    (0, common_1.Get)('proof/:fileId'),
    __param(0, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "getDispatchProof", null);
__decorate([
    (0, common_1.Get)('proofs'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('dateFrom')),
    __param(2, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "getDispatchProofs", null);
__decorate([
    (0, common_1.Get)('proofs/:id/download/:type'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('type')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "downloadDispatchDocument", null);
exports.DispatchController = DispatchController = __decorate([
    (0, common_1.Controller)('dispatch'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [dispatch_service_1.DispatchService])
], DispatchController);
//# sourceMappingURL=dispatch.controller.js.map