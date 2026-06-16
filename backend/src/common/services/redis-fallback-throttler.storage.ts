import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface.js';
import Redis from 'ioredis';

export class RedisFallbackThrottlerStorage implements ThrottlerStorage {
  private memoryStore = new Map<
    string,
    { hits: number; expiresAt: number; blockExpiresAt?: number }
  >();

  constructor(private readonly getRedisClient: () => Redis | null) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redis = this.getRedisClient();
    const now = Date.now();
    const ttlMs = ttl * 1000;

    if (redis) {
      try {
        const keyWithPrefix = `throttler:${throttlerName}:${key}`;
        const multi = redis.multi();
        multi.incr(keyWithPrefix);
        multi.pttl(keyWithPrefix);
        const results = await multi.exec();

        if (results) {
          const hits = results[0][1] as number;
          let pttl = results[1][1] as number;

          if (pttl < 0) {
            await redis.pexpire(keyWithPrefix, ttlMs);
            pttl = ttlMs;
          }

          const isBlocked = hits > limit;
          if (isBlocked) {
            // Apply block duration if blocked
            await redis.pexpire(keyWithPrefix, blockDuration * 1000);
            pttl = blockDuration * 1000;
          }

          return {
            totalHits: hits,
            timeToExpire: Math.max(0, Math.ceil(pttl / 1000)),
            isBlocked,
            timeToBlockExpire: isBlocked
              ? Math.max(0, Math.ceil(pttl / 1000))
              : 0,
          };
        }
      } catch {
        // Fallback to memory
      }
    }

    // In-memory fallback
    const expiresAt = now + ttlMs;
    const record = this.memoryStore.get(key);

    if (!record || now > record.expiresAt) {
      const newRecord = { hits: 1, expiresAt };
      this.memoryStore.set(key, newRecord);
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    record.hits += 1;
    const isBlocked = record.hits > limit;
    if (isBlocked && !record.blockExpiresAt) {
      record.blockExpiresAt = now + blockDuration * 1000;
      record.expiresAt = record.blockExpiresAt; // extend TTL to match block
    }

    const timeToExpire = Math.max(
      0,
      Math.ceil((record.expiresAt - now) / 1000),
    );
    const timeToBlockExpire = record.blockExpiresAt
      ? Math.max(0, Math.ceil((record.blockExpiresAt - now) / 1000))
      : 0;

    return {
      totalHits: record.hits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }
}
