import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FilesPublicController } from './files-public.controller';
import { TimingModule } from '../timing/timing.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [TimingModule, SecurityModule],
  controllers: [FilesPublicController, FilesController], // Public controller first for route priority
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
