import { Module } from '@nestjs/common';
import { BackFilesService } from './backfiles.service';
import { BackFilesController } from './backfiles.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MinIOModule } from '../minio/minio.module';

@Module({
  imports: [PrismaModule, MinIOModule],
  controllers: [BackFilesController],
  providers: [BackFilesService],
  exports: [BackFilesService],
})
export class BackFilesModule {}

