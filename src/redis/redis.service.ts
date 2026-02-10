import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  @Inject('REDIS_CLIENT')
  private redisClient: RedisClientType;

  // 获取指定 key 的值
  async get(key: string) {
    return await this.redisClient.get(key);
  }

  // 设置指定 key 的值和过期时间
  async set(key: string, value: string | number, ttl?: number) {
    await this.redisClient.set(key, value);

    if (ttl) {
      await this.redisClient.expire(key, ttl);
    }
  }

  // 删除指定 key
  async del(key: string) {
    await this.redisClient.del(key);
  }
}
