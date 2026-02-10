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
  async presignedPutObject(@Query('name') name: string) {
    const url = await this.minioClient.presignedPutObject(
      this.configService.get('minio_bucket_name') ||
        'meeting-room-booking-system',
      name,
      3600,
    );
    return url.replace('minio-container:9000', 'localhost:9000');
  }
}
