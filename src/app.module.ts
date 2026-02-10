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
import { AuthModule } from './auth/auth.module';
import * as winston from 'winston';
import {
  WINSTON_MODULE_NEST_PROVIDER,
  WinstonLogger,
  WinstonModule,
  utilities,
} from 'nest-winston';
import { CustomTypeOrmLogger } from '@/CustomTypeOrmLogger';
import 'winston-daily-rotate-file';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService, WINSTON_MODULE_NEST_PROVIDER],
      useFactory(configService: ConfigService, logger: WinstonLogger) {
        const syncConfig =
          configService.get('mysql_server_synchronize') === 'true';
        return {
          type: 'mysql',
          host: configService.get<string>('mysql_server_host'),
          port: configService.get<number>('mysql_server_port'), // 数据库服务器端口
          username: configService.get<string>('mysql_server_username'), // 数据库用户名
          password: configService.get<string>('mysql_server_password'), // 数据库密码
          database: configService.get<string>('mysql_server_database'), // 数据库名称
          synchronize: syncConfig, // 禁用自动同步数据库模式
          logging: true, // 开启日志记录
          entities: [User, Role, Permission, MeetingRoom, Booking],
          logger: new CustomTypeOrmLogger(logger),
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
    // 配置 Winston 模块 用来记录日志
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        level: configService.get('winston_log_level') || 'debug',
        transports: [
          // 日志文件传输
          // new winston.transports.File({
          //   filename: `${process.cwd()}/log`,
          // }),
          new winston.transports.DailyRotateFile({
            level: configService.get('winston_log_level') || 'debug', // 记录 debug 及以上的所有日志（非常详细）
            dirname: configService.get('winston_log_dirname') || 'daily-log', // 日志存放在项目根目录下的 daily-log 文件夹里
            filename:
              configService.get('winston_log_filename') || 'log-%DATE%.log', // %DATE% 会被替换为下方的日期格式
            datePattern:
              configService.get('winston_log_date_pattern') || 'YYYY-MM-DD', // 规定日期格式，决定了日志每天切分一次
            maxSize: configService.get('winston_log_max_size') || '10k', // 💡 关键：单个文件满 10KB 就自动存入下一个新文件
          }),
          // 控制台传输
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              utilities.format.nestLike(),
            ),
          }),
          // 日志服务
          new winston.transports.Http({
            host: configService.get('winston_log_http_host') || 'localhost',
            port: configService.get('winston_log_http_port') || 3002,
            path: configService.get('winston_log_http_path') || '/log',
          }),
        ],
      }),
    }),
    UserModule,
    RedisModule,
    EmailModule,
    MeetingRoomModule,
    BookingModule,
    StatisticModule,
    MinioModule,
    AuthModule,
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
