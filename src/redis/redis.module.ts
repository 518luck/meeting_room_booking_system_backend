import { Global, Module } from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    RedisService,
    {
      inject: [ConfigService],
      provide: 'REDIS_CLIENT',
      async useFactory(configService: ConfigService) {
        const host = configService.get<string>('redis_server_host');
        const port = configService.get<number>('redis_server_port');
        const db = configService.get<number>('redis_server_db');
        const client = createClient({
          socket: {
            host: host,
            port: port,
          },
          database: db,
        });
        await client.connect();
        return client;
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
