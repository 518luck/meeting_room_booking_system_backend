import { Controller, Get, Inject, Query } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';

@Controller('minio')
export class MinioController {
  @Inject('MINIO_CLIENT') //给nestJs看的
  private minioClient: Minio.Client; //给TypeScript看的

  @Inject(ConfigService)
  private configService: ConfigService;

  @Get('presignedUrl')
  presignedPutObject(@Query('name') name: string) {
    return this.minioClient.presignedPutObject(
      this.configService.get('minio_bucket_name') ||
        'meeting-room-booking-system',
      name,
      3600,
    );
  }
}
