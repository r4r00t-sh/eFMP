import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FilesPublicController } from './files-public.controller';
import { TimingModule } from '../timing/timing.module';

@Module({
  imports: [TimingModule],
  controllers: [FilesPublicController, FilesController], // Public controller first for route priority
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

