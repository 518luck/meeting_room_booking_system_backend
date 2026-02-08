import { Global, Module } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { MinioController } from './minio.controller';

@Global()
@Module({
  providers: [
    {
      provide: 'MINIO_CLIENT',
      useFactory(configService: ConfigService) {
        const client = new Minio.Client({
          endPoint: configService.get('minio_endpoint') || 'localhost',
          port: +configService.get('minio_port'),
          useSSL: false,
          accessKey: configService.get('minio_access_key'),
          secretKey: configService.get('minio_secret_key'),
        });
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['MINIO_CLIENT'],
  controllers: [MinioController],
})
export class MinioModule {}
