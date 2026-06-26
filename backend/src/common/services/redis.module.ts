import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service.js';
import { NotificationService } from './notification.service.js';

@Global()
@Module({
  providers: [RedisService, NotificationService],
  exports: [RedisService, NotificationService],
})
export class RedisModule {}
