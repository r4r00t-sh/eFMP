"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackFilesModule = void 0;
const common_1 = require("@nestjs/common");
const backfiles_service_1 = require("./backfiles.service");
const backfiles_controller_1 = require("./backfiles.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const minio_module_1 = require("../minio/minio.module");
let BackFilesModule = class BackFilesModule {
};
exports.BackFilesModule = BackFilesModule;
exports.BackFilesModule = BackFilesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, minio_module_1.MinIOModule],
        controllers: [backfiles_controller_1.BackFilesController],
        providers: [backfiles_service_1.BackFilesService],
        exports: [backfiles_service_1.BackFilesService],
    })
], BackFilesModule);
//# sourceMappingURL=backfiles.module.js.map