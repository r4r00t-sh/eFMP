import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MinIOModule } from '../minio/minio.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [PrismaModule, NotificationsModule, MinIOModule, SecurityModule],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
