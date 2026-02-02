import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SecurityService } from './security.service';
import { FileUploadGuard } from './file-upload.guard';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000, // 1 minute
            limit: config.get<number>('RATE_LIMIT_DEFAULT', 100), // 100 requests per minute
          },
        ],
      }),
    }),
  ],
  providers: [
    SecurityService,
    FileUploadGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [SecurityService, FileUploadGuard],
})
export class SecurityModule {}
