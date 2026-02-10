import { WinstonLogger } from 'nest-winston';
import { Logger, QueryRunner } from 'typeorm';

export class CustomTypeOrmLogger implements Logger {
  constructor(private winstonLogger: WinstonLogger) {}

  log(level: 'log' | 'info' | 'warn', message: any) {
    this.winstonLogger.log(message);
  }

  //  SQL 记录仪
  //每当你执行 find()、save() 等数据库操作时，这个方法会被触发。
  //   queryRunner?: 这是当前的数据库查询运行器（通常用于处理事务）。
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.winstonLogger.log({
      sql: query,
      parameters,
    });
  }

  //数据库报错捕获
  //如果 SQL 写错了，或者数据库连接断了，这个方法会执行。
  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    this.winstonLogger.error({
      sql: query,
      parameters,
    });
  }

  //性能监控
  //如果一条 SQL 执行时间过长，它会记录下耗时（time）。
  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    this.winstonLogger.log({
      sql: query,
      parameters,
      time,
    });
  }

  // 模式构建记录器
  // 当你执行 schemaBuilder.createSchema() 时，这个方法会被触发。
  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.winstonLogger.log(message);
  }

  // 迁移记录器
  // 当你执行 migration:run 或 migration:revert 时，这个方法会被触发。
  logMigration(message: string, queryRunner?: QueryRunner) {
    this.winstonLogger.log(message);
  }
}
