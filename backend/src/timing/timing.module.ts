import { Module } from '@nestjs/common';
import { TimingService } from './timing.service';

@Module({
  providers: [TimingService],
  exports: [TimingService],
})
export class TimingModule {}

