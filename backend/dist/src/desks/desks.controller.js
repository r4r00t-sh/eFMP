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
exports.DesksController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const desks_service_1 = require("./desks.service");
let DesksController = class DesksController {
    desksService;
    constructor(desksService) {
        this.desksService = desksService;
    }
    async createDesk(req, body) {
        return this.desksService.createDesk(req.user.id, req.user.role, body);
    }
    async getDesks(req, departmentId, divisionId) {
        const deptId = departmentId || (req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined);
        return this.desksService.getDesks(deptId, divisionId);
    }
    async getDeskById(id) {
        return this.desksService.getDeskById(id);
    }
    async getDeskWorkloadSummary(req) {
        const departmentId = req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined;
        return this.desksService.getDeskWorkloadSummary(departmentId);
    }
    async assignFileToDesk(req, body) {
        return this.desksService.assignFileToDesk(body.fileId, body.deskId, req.user.id, req.user.role);
    }
    async updateDeskCapacity(id) {
        return this.desksService.updateDeskCapacity(id);
    }
    async checkAndAutoCreateDesk(req, body) {
        const departmentId = req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined;
        if (!departmentId) {
            throw new Error('Department ID required');
        }
        return this.desksService.checkAndAutoCreateDesk(departmentId, body.divisionId);
    }
    async updateDesk(id, req, body) {
        return this.desksService.updateDesk(id, req.user.id, req.user.role, body);
    }
    async deleteDesk(id, req) {
        return this.desksService.deleteDesk(id, req.user.id, req.user.role);
    }
};
exports.DesksController = DesksController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DesksController.prototype, "createDesk", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('departmentId')),
    __param(2, (0, common_1.Query)('divisionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DesksController.prototype, "getDesks", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DesksController.prototype, "getDeskById", null);
__decorate([
    (0, common_1.Get)('workload/summary'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DesksController.prototype, "getDeskWorkloadSummary", null);
__decorate([
    (0, common_1.Post)('assign'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DesksController.prototype, "assignFileToDesk", null);
__decorate([
    (0, common_1.Post)(':id/update-capacity'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DesksController.prototype, "updateDeskCapacity", null);
__decorate([
    (0, common_1.Post)('auto-create'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DesksController.prototype, "checkAndAutoCreateDesk", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DesksController.prototype, "updateDesk", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DesksController.prototype, "deleteDesk", null);
exports.DesksController = DesksController = __decorate([
    (0, common_1.Controller)('desks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [desks_service_1.DesksService])
], DesksController);
//# sourceMappingURL=desks.controller.js.map