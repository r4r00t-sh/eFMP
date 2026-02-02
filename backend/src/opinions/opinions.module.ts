import { Module } from '@nestjs/common';
import { OpinionsService } from './opinions.service';
import { OpinionsController } from './opinions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MinIOModule } from '../minio/minio.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [PrismaModule, NotificationsModule, MinIOModule, SecurityModule],
  controllers: [OpinionsController],
  providers: [OpinionsService],
  exports: [OpinionsService],
})
export class OpinionsModule {}
