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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getDashboardAnalytics(req, dateFrom, dateTo) {
        const departmentId = req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined;
        return this.analyticsService.getDashboardAnalytics(departmentId, dateFrom ? new Date(dateFrom) : undefined, dateTo ? new Date(dateTo) : undefined);
    }
    async getDepartmentAnalytics() {
        return this.analyticsService.getDepartmentAnalytics();
    }
    async getUserPerformanceAnalytics(req, limit) {
        const departmentId = req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined;
        return this.analyticsService.getUserPerformanceAnalytics(departmentId, limit ? parseInt(limit) : 50);
    }
    async getProcessingTimeAnalytics(req) {
        const departmentId = req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined;
        return this.analyticsService.getProcessingTimeAnalytics(departmentId);
    }
    async getBottleneckAnalysis(req) {
        const departmentId = req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined;
        return this.analyticsService.getBottleneckAnalysis(departmentId);
    }
    async generateReport(req, type, dateFrom, dateTo) {
        const departmentId = req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined;
        return this.analyticsService.generateReport(type || 'summary', departmentId, dateFrom ? new Date(dateFrom) : undefined, dateTo ? new Date(dateTo) : undefined);
    }
    async exportReportCSV(req, res, type, dateFrom, dateTo) {
        const departmentId = req.user.role === client_1.UserRole.DEPT_ADMIN ? req.user.departmentId : undefined;
        const data = await this.analyticsService.generateReport(type || 'detailed', departmentId, dateFrom ? new Date(dateFrom) : undefined, dateTo ? new Date(dateTo) : undefined);
        let csv = '';
        const filename = `efiling-report-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        if (type === 'detailed' && data.files) {
            csv = this.convertToCSV(data.files);
        }
        else if (type === 'user_performance' && data.users) {
            csv = this.convertToCSV(data.users);
        }
        else if (type === 'department' && data.departments) {
            csv = this.convertToCSV(data.departments);
        }
        else if (data.summary) {
            csv = this.convertSummaryToCSV(data);
        }
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }
    convertToCSV(data) {
        if (!data || data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined)
                return '';
            if (typeof value === 'object')
                return JSON.stringify(value);
            if (typeof value === 'string' && value.includes(','))
                return `"${value}"`;
            return String(value);
        }).join(','));
        return [headers.join(','), ...rows].join('\n');
    }
    convertSummaryToCSV(data) {
        const lines = [];
        lines.push('Metric,Value');
        if (data.summary) {
            Object.entries(data.summary).forEach(([key, value]) => {
                lines.push(`${key},${value}`);
            });
        }
        if (data.filesByPriority) {
            lines.push('');
            lines.push('Files by Priority');
            lines.push('Priority,Count');
            data.filesByPriority.forEach((p) => {
                lines.push(`${p.priority},${p.count}`);
            });
        }
        return lines.join('\n');
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('dateFrom')),
    __param(2, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboardAnalytics", null);
__decorate([
    (0, common_1.Get)('departments'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDepartmentAnalytics", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserPerformanceAnalytics", null);
__decorate([
    (0, common_1.Get)('processing-time'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getProcessingTimeAnalytics", null);
__decorate([
    (0, common_1.Get)('bottlenecks'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getBottleneckAnalysis", null);
__decorate([
    (0, common_1.Get)('report'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('dateFrom')),
    __param(3, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "generateReport", null);
__decorate([
    (0, common_1.Get)('report/export'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.DEPT_ADMIN),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('dateFrom')),
    __param(4, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "exportReportCSV", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map