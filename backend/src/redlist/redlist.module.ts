import { Module } from '@nestjs/common';
import { RedListService } from './redlist.service';
import { GamificationModule } from '../gamification/gamification.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [GamificationModule, RabbitMQModule],
  providers: [RedListService],
  exports: [RedListService],
})
export class RedListModule {}
