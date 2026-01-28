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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getAllUsers(req, departmentId, role, search) {
        if (!['SUPER_ADMIN', 'DEPT_ADMIN'].includes(req.user.role)) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        const filterDeptId = req.user.role === 'DEPT_ADMIN' ? req.user.departmentId : departmentId;
        return this.usersService.getAllUsers({ departmentId: filterDeptId, role, search });
    }
    async getUser(id, req) {
        if (id !== req.user.id && !['SUPER_ADMIN', 'DEPT_ADMIN'].includes(req.user.role)) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        return this.usersService.getUserById(id);
    }
    async createUser(req, body) {
        if (!['SUPER_ADMIN', 'DEPT_ADMIN'].includes(req.user.role)) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (req.user.role === 'DEPT_ADMIN' && body.departmentId !== req.user.departmentId) {
            throw new common_1.ForbiddenException('Can only create users in your department');
        }
        return this.usersService.createUser(body);
    }
    async updateUser(id, req, body) {
        if (id !== req.user.id && !['SUPER_ADMIN', 'DEPT_ADMIN'].includes(req.user.role)) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (id === req.user.id && !['SUPER_ADMIN', 'DEPT_ADMIN'].includes(req.user.role)) {
            return this.usersService.updateUser(id, {
                name: body.name,
                email: body.email,
            });
        }
        return this.usersService.updateUser(id, body);
    }
    async updatePassword(id, req, body) {
        if (id !== req.user.id && !['SUPER_ADMIN'].includes(req.user.role)) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (id === req.user.id && !['SUPER_ADMIN'].includes(req.user.role)) {
            return this.usersService.changePassword(id, body.currentPassword, body.newPassword);
        }
        return this.usersService.resetPassword(id, body.newPassword);
    }
    async deleteUser(id, req) {
        if (req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Not authorized');
        }
        return this.usersService.deactivateUser(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('departmentId')),
    __param(2, (0, common_1.Query)('role')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUser", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Put)(':id/password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePassword", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map