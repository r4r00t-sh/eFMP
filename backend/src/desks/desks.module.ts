import { Module } from '@nestjs/common';
import { DesksService } from './desks.service';
import { DesksController } from './desks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DesksController],
  providers: [DesksService],
  exports: [DesksService],
})
export class DesksModule {}
