import { BadRequestException, ParseIntPipe } from '@nestjs/common';
import * as crypto from 'crypto';

export function md5(str: string) {
  const hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}

// 生成一个 ParseIntPipe 管道，用于将字符串转换为整数
// 如果转换失败，抛出一个 BadRequestException 异常，异常消息为 name + ' 应该传数字'
export function generateParseIntPipe(name: string) {
  return new ParseIntPipe({
    exceptionFactory() {
      throw new BadRequestException(name + ' 应该传数字');
    },
  });
}
