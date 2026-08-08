import { KeyvStoreAdapter } from 'keyv';
import Redis from 'ioredis';

export class RedisFallbackCacheStore implements KeyvStoreAdapter {
  opts: any = {};
  namespace?: string;
  private memoryStore = new Map<string, { value: any; expires: number }>();
  // Keys this process has written, so clear() can delete exactly what we own
  // without relying on namespace prefixes or flushing shared Redis data.
  private trackedKeys = new Set<string>();

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
    this.trackedKeys.add(key);
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

  on(_event: string, _listener: (...arguments_: any[]) => void): this {
    return this;
  }

  async clear(): Promise<void> {
    const redis = this.getRedisClient();
    if (redis) {
      try {
        // Delete exactly the keys this process has written, PLUS a SCAN of
        // keys from previous processes (keyv default namespace prefix).
        // Never use flushdb() — this Redis instance may be shared with
        // throttler counters and other applications; flushing would destroy
        // unrelated data.
        const keysToDelete = new Set<string>(this.trackedKeys);
        let cursor = '0';
        do {
          const [nextCursor, keys] = await redis.scan(
            cursor,
            'MATCH',
            'keyv:*',
            'COUNT',
            100,
          );
          cursor = nextCursor;
          keys.forEach((k) => keysToDelete.add(k));
        } while (cursor !== '0');

        const batch = Array.from(keysToDelete);
        for (let i = 0; i < batch.length; i += 100) {
          await redis.del(...batch.slice(i, i + 100));
        }
        this.trackedKeys.clear();
        return;
      } catch {
        // Fallback to memory if redis fails
      }
    }
    this.memoryStore.clear();
    this.trackedKeys.clear();
  }
}
