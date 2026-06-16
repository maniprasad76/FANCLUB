import { KeyvStoreAdapter } from 'keyv';
import Redis from 'ioredis';

export class RedisFallbackCacheStore implements KeyvStoreAdapter {
  opts: any = {};
  namespace?: string;
  private memoryStore = new Map<string, { value: any; expires: number }>();

  constructor(private readonly getRedisClient: () => Redis | null) {}

  async get<T>(key: string): Promise<T | undefined> {
    const redis = this.getRedisClient();
    if (redis) {
      try {
        const val = await redis.get(key);
        return val ? JSON.parse(val) : undefined;
      } catch {
        // Fallback to memory if redis fails
      }
    }
    const item = this.memoryStore.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expires) {
      this.memoryStore.delete(key);
      return undefined;
    }
    return item.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<any> {
    const redis = this.getRedisClient();
    const expiryMs = ttl !== undefined ? ttl : 300000; // default 5 mins
    if (redis) {
      try {
        await redis.set(key, JSON.stringify(value), 'PX', expiryMs);
        return true;
      } catch {
        // Fallback to memory
      }
    }
    this.memoryStore.set(key, {
      value,
      expires: Date.now() + expiryMs,
    });
    return true;
  }

  async delete(key: string): Promise<boolean> {
    const redis = this.getRedisClient();
    if (redis) {
      try {
        const result = await redis.del(key);
        return result > 0;
      } catch {
        // Fallback to memory if redis fails
      }
    }
    return this.memoryStore.delete(key);
  }

  on(event: string, listener: (...arguments_: any[]) => void): this {
    return this;
  }

  async clear(): Promise<void> {
    const redis = this.getRedisClient();
    if (redis) {
      try {
        await redis.flushdb();
        return;
      } catch {
        // Fallback to memory if redis fails
      }
    }
    this.memoryStore.clear();
  }
}
