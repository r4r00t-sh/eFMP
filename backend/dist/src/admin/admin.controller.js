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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    checkAdminAccess(userRole) {
        if (!['SUPER_ADMIN', 'DEPT_ADMIN'].includes(userRole)) {
            throw new common_1.ForbiddenException('Admin access required');
        }
    }
    async getDeskStatus(req) {
        this.checkAdminAccess(req.user.role);
        return this.adminService.getDeskStatus(req.user.departmentId, req.user.role);
    }
    async getDepartmentFiles(req, status, search, isRedListed, assignedToId, page, limit) {
        this.checkAdminAccess(req.user.role);
        return this.adminService.getDepartmentFiles(req.user.departmentId, req.user.role, {
            status,
            search,
            isRedListed: isRedListed === 'true' ? true : isRedListed === 'false' ? false : undefined,
            assignedToId,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }
    async getAnalytics(req) {
        this.checkAdminAccess(req.user.role);
        return this.adminService.getAnalytics(req.user.departmentId, req.user.role);
    }
    async getDepartmentWiseAnalytics(req) {
        if (req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Super Admin access required');
        }
        return this.adminService.getDepartmentWiseAnalytics();
    }
    async getRedListedFiles(req) {
        this.checkAdminAccess(req.user.role);
        return this.adminService.getRedListedFiles(req.user.departmentId, req.user.role);
    }
    async getExtensionRequests(req) {
        this.checkAdminAccess(req.user.role);
        return this.adminService.getExtensionRequests(req.user.departmentId, req.user.role);
    }
    async getSettings(req) {
        this.checkAdminAccess(req.user.role);
        const departmentId = req.user.role === 'DEPT_ADMIN' ? req.user.departmentId : undefined;
        return this.adminService.getSettings(departmentId);
    }
    async updateSetting(req, key, body) {
        this.checkAdminAccess(req.user.role);
        const departmentId = req.user.role === 'DEPT_ADMIN' ? req.user.departmentId : undefined;
        return this.adminService.updateSetting(key, body.value, req.user.id, departmentId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('desk-status'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDeskStatus", null);
__decorate([
    (0, common_1.Get)('files'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('isRedListed')),
    __param(4, (0, common_1.Query)('assignedToId')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDepartmentFiles", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/departments'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDepartmentWiseAnalytics", null);
__decorate([
    (0, common_1.Get)('redlist'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRedListedFiles", null);
__decorate([
    (0, common_1.Get)('extension-requests'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getExtensionRequests", null);
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings/:key'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('key')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSetting", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map