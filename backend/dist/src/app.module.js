"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const rabbitmq_module_1 = require("./rabbitmq/rabbitmq.module");
const minio_module_1 = require("./minio/minio.module");
const presence_module_1 = require("./presence/presence.module");
const gamification_module_1 = require("./gamification/gamification.module");
const timing_module_1 = require("./timing/timing.module");
const redlist_module_1 = require("./redlist/redlist.module");
const auth_module_1 = require("./auth/auth.module");
const files_module_1 = require("./files/files.module");
const departments_module_1 = require("./departments/departments.module");
const notes_module_1 = require("./notes/notes.module");
const users_module_1 = require("./users/users.module");
const health_module_1 = require("./health/health.module");
const notifications_module_1 = require("./notifications/notifications.module");
const admin_module_1 = require("./admin/admin.module");
const analytics_module_1 = require("./analytics/analytics.module");
const documents_module_1 = require("./documents/documents.module");
const opinions_module_1 = require("./opinions/opinions.module");
const desks_module_1 = require("./desks/desks.module");
const dispatch_module_1 = require("./dispatch/dispatch.module");
const performance_module_1 = require("./performance/performance.module");
const backfiles_module_1 = require("./backfiles/backfiles.module");
const security_module_1 = require("./security/security.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            security_module_1.SecurityModule,
            rabbitmq_module_1.RabbitMQModule,
            minio_module_1.MinIOModule,
            presence_module_1.PresenceModule,
            gamification_module_1.GamificationModule,
            timing_module_1.TimingModule,
            redlist_module_1.RedListModule,
            auth_module_1.AuthModule,
            files_module_1.FilesModule,
            departments_module_1.DepartmentsModule,
            notes_module_1.NotesModule,
            users_module_1.UsersModule,
            health_module_1.HealthModule,
            notifications_module_1.NotificationsModule,
            admin_module_1.AdminModule,
            analytics_module_1.AnalyticsModule,
            documents_module_1.DocumentsModule,
            opinions_module_1.OpinionsModule,
            desks_module_1.DesksModule,
            dispatch_module_1.DispatchModule,
            performance_module_1.PerformanceModule,
            backfiles_module_1.BackFilesModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map