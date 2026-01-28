import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as MinIO from 'minio';

@Injectable()
export class MinIOService implements OnModuleInit {
  private minioClient: MinIO.Client;
  private bucketName: string;
  private internalEndpoint: string;
  private internalPort: number;
  private publicEndpoint: string;
  private publicPort: number;

  constructor(private configService: ConfigService) {
    this.internalEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    this.internalPort = parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10);
    this.publicEndpoint = this.configService.get<string>('MINIO_PUBLIC_ENDPOINT', 'localhost');
    this.publicPort = parseInt(this.configService.get<string>('MINIO_PUBLIC_PORT', '9000'), 10);
    const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    
    this.minioClient = new MinIO.Client({
      endPoint: this.internalEndpoint,
      port: this.internalPort,
      useSSL: useSSL,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin123'),
    });
    
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME', 'efiling-documents');
  }

  async onModuleInit() {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
    }
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const objectName = `${Date.now()}-${fileName}`;
    await this.minioClient.putObject(this.bucketName, objectName, fileBuffer, fileBuffer.length, {
      'Content-Type': contentType,
    });
    return objectName;
  }

  async getFileUrl(objectName: string, expirySeconds: number = 3600): Promise<string> {
    // Get presigned URL using internal client
    const url = await this.minioClient.presignedGetObject(this.bucketName, objectName, expirySeconds);
    
    // If internal and public endpoints are the same, no replacement needed
    if (this.internalEndpoint === this.publicEndpoint && this.internalPort === this.publicPort) {
      return url;
    }
    
    // Replace the internal endpoint with public endpoint for browser access
    // MinIO presigned URLs use path-style access, so the signature is NOT tied to the hostname
    const internalHost = `${this.internalEndpoint}:${this.internalPort}`;
    const publicHost = `${this.publicEndpoint}:${this.publicPort}`;
    
    return url.replace(internalHost, publicHost);
  }

  async deleteFile(objectName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucketName, objectName);
  }

  async getFileStream(objectName: string): Promise<NodeJS.ReadableStream> {
    return await this.minioClient.getObject(this.bucketName, objectName);
  }

  async getFileBuffer(objectName: string): Promise<Buffer> {
    const stream = await this.getFileStream(objectName);
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  getBucketName(): string {
    return this.bucketName;
  }
}
