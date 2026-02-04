// TypeORM 数据源配置文件
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

import { Permission } from '@/user/entities/permission.entity';
import { Role } from '@/user/entities/role.entity';
import { User } from '@/user/entities/user.entity';
import { MeetingRoom } from '@/meeting-room/entities/meeting-room.entity';
import { Booking } from '@/booking/entities/booking.entity';

config({ path: 'src/.env-migration' });

console.log(process.env);

// 数据库连接管家
export default new DataSource({
  type: 'mysql',
  host: `${process.env.mysql_server_host}`,
  port: +`${process.env.mysql_server_port}`, // 数据库服务器端口
  username: `${process.env.mysql_server_username}`, // 数据库用户名
  password: `${process.env.mysql_server_password}`, // 数据库密码
  database: `${process.env.mysql_server_database}`, // 数据库名称
  synchronize: false, // 禁用自动同步数据库模式
  logging: true, // 开启日志记录
  entities: [User, Role, Permission, MeetingRoom, Booking],
  poolSize: 10, // 定义了数据库连接池
  migrations: ['src/migrations/**.ts'], // 定义了迁移文件的路径
  connectorPackage: 'mysql2', // 定义了使用的数据库驱动
  extra: {
    authPlugin: 'sha256_password', // 定义了使用的认证插件
  },
});
