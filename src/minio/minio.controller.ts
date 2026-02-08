import { Controller, Get, Inject, Query } from '@nestjs/common';
import * as Minio from 'minio';

@Controller('minio')
export class MinioController {
  @Inject('MINIO_CLIENT') //给nestJs看的
  private minioClient: Minio.Client; //给TypeScript看的

  @Get('presignedUrl')
  presignedPutObject(@Query('name') name: string) {
    return this.minioClient.presignedPutObject(
      'meeting-room-booking-system',
      name,
      3600,
    );
  }
}
