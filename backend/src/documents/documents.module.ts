import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { MinIOModule } from '../minio/minio.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [MinIOModule, SecurityModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
