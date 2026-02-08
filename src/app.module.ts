import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UserModule } from '@/user/user.module';
import { User } from '@/user/entities/user.entity';
import { Role } from '@/user/entities/role.entity';
import { Permission } from '@/user/entities/permission.entity';
import { RedisModule } from '@/redis/redis.module';
import { EmailModule } from '@/email/email.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { LoginGuard } from '@/login.guard';
import { PermissionGuard } from '@/permission.guard';
import { MeetingRoomModule } from '@/meeting-room/meeting-room.module';
import { MeetingRoom } from '@/meeting-room/entities/meeting-room.entity';
import { BookingModule } from '@/booking/booking.module';
import { Booking } from '@/booking/entities/booking.entity';
import { StatisticModule } from './statistic/statistic.module';
import { MinioModule } from './minio/minio.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          type: 'mysql',
          host: configService.get<string>('mysql_server_host'),
          port: configService.get<number>('mysql_server_port'), // 数据库服务器端口
          username: configService.get<string>('mysql_server_username'), // 数据库用户名
          password: configService.get<string>('mysql_server_password'), // 数据库密码
          database: configService.get<string>('mysql_server_database'), // 数据库名称
          synchronize: false, // 禁用自动同步数据库模式
          logging: true, // 开启日志记录
          entities: [User, Role, Permission, MeetingRoom, Booking],
          poolSize: 10, // 定义了数据库连接池
          connectorPackage: 'mysql2', // 定义了使用的数据库驱动
          extra: {
            authPlugin: 'sha256_password', // 定义了使用的认证插件
          },
        };
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: 'src/.env',
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development',
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get('jwt_secret'),
          signOptions: {
            expiresIn: '30m', // 默认 30 分钟
          },
        };
      },
    }),
    UserModule,
    RedisModule,
    EmailModule,
    MeetingRoomModule,
    BookingModule,
    StatisticModule,
    MinioModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoginGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
