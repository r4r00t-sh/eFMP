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
exports.FilesPublicController = void 0;
const common_1 = require("@nestjs/common");
const stream_1 = require("stream");
const files_service_1 = require("./files.service");
let FilesPublicController = class FilesPublicController {
    filesService;
    constructor(filesService) {
        this.filesService = filesService;
    }
    async downloadAttachment(attachmentId, res) {
        const { stream, filename, mimeType } = await this.filesService.getAttachmentStream(attachmentId);
        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
            'Cache-Control': 'public, max-age=3600',
        });
        return new common_1.StreamableFile(stream_1.Readable.from(stream));
    }
    async downloadLegacyFile(s3Key, res) {
        const stream = await this.filesService.getLegacyFileStream(s3Key);
        const filename = s3Key.includes('-') ? s3Key.substring(s3Key.indexOf('-') + 1) : s3Key;
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
            'Cache-Control': 'public, max-age=3600',
        });
        return new common_1.StreamableFile(stream_1.Readable.from(stream));
    }
};
exports.FilesPublicController = FilesPublicController;
__decorate([
    (0, common_1.Get)('attachments/:attachmentId/download'),
    __param(0, (0, common_1.Param)('attachmentId')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesPublicController.prototype, "downloadAttachment", null);
__decorate([
    (0, common_1.Get)('attachments/legacy/download'),
    __param(0, (0, common_1.Query)('key')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesPublicController.prototype, "downloadLegacyFile", null);
exports.FilesPublicController = FilesPublicController = __decorate([
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesPublicController);
//# sourceMappingURL=files-public.controller.js.map