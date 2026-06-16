import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL is not defined in environment variables. Caching and rate limiting will fall back to in-memory mode.',
      );
      return;
    }

    try {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        reconnectOnError: () => false,
      });

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Successfully connected to Redis.');
      });

      this.redisClient.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(
          `Redis connection error: ${err.message}. Running in fallback in-memory mode.`,
        );
      });
    } catch (err) {
      this.logger.error(
        `Failed to initialize Redis client: ${(err as Error).message}`,
      );
    }
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  getClient(): Redis | null {
    return this.isConnected ? this.redisClient : null;
  }

  get isAvailable(): boolean {
    return this.isConnected;
  }
}
