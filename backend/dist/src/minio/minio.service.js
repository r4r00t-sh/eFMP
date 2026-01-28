"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinIOService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const MinIO = __importStar(require("minio"));
let MinIOService = class MinIOService {
    configService;
    minioClient;
    bucketName;
    internalEndpoint;
    internalPort;
    publicEndpoint;
    publicPort;
    constructor(configService) {
        this.configService = configService;
        this.internalEndpoint = this.configService.get('MINIO_ENDPOINT', 'localhost');
        this.internalPort = parseInt(this.configService.get('MINIO_PORT', '9000'), 10);
        this.publicEndpoint = this.configService.get('MINIO_PUBLIC_ENDPOINT', 'localhost');
        this.publicPort = parseInt(this.configService.get('MINIO_PUBLIC_PORT', '9000'), 10);
        const useSSL = this.configService.get('MINIO_USE_SSL', 'false') === 'true';
        this.minioClient = new MinIO.Client({
            endPoint: this.internalEndpoint,
            port: this.internalPort,
            useSSL: useSSL,
            accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
            secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin123'),
        });
        this.bucketName = this.configService.get('MINIO_BUCKET_NAME', 'efiling-documents');
    }
    async onModuleInit() {
        const exists = await this.minioClient.bucketExists(this.bucketName);
        if (!exists) {
            await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        }
    }
    async uploadFile(fileName, fileBuffer, contentType) {
        const objectName = `${Date.now()}-${fileName}`;
        await this.minioClient.putObject(this.bucketName, objectName, fileBuffer, fileBuffer.length, {
            'Content-Type': contentType,
        });
        return objectName;
    }
    async getFileUrl(objectName, expirySeconds = 3600) {
        const url = await this.minioClient.presignedGetObject(this.bucketName, objectName, expirySeconds);
        if (this.internalEndpoint === this.publicEndpoint && this.internalPort === this.publicPort) {
            return url;
        }
        const internalHost = `${this.internalEndpoint}:${this.internalPort}`;
        const publicHost = `${this.publicEndpoint}:${this.publicPort}`;
        return url.replace(internalHost, publicHost);
    }
    async deleteFile(objectName) {
        await this.minioClient.removeObject(this.bucketName, objectName);
    }
    async getFileStream(objectName) {
        return await this.minioClient.getObject(this.bucketName, objectName);
    }
    async getFileBuffer(objectName) {
        const stream = await this.getFileStream(objectName);
        const chunks = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('error', (err) => reject(err));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
    getBucketName() {
        return this.bucketName;
    }
};
exports.MinIOService = MinIOService;
exports.MinIOService = MinIOService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MinIOService);
//# sourceMappingURL=minio.service.js.map