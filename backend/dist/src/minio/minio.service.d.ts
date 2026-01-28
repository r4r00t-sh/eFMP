import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class MinIOService implements OnModuleInit {
    private configService;
    private minioClient;
    private bucketName;
    private internalEndpoint;
    private internalPort;
    private publicEndpoint;
    private publicPort;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    uploadFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string>;
    getFileUrl(objectName: string, expirySeconds?: number): Promise<string>;
    deleteFile(objectName: string): Promise<void>;
    getFileStream(objectName: string): Promise<NodeJS.ReadableStream>;
    getFileBuffer(objectName: string): Promise<Buffer>;
    getBucketName(): string;
}
