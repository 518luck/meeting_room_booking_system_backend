import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

export class UnLoginException extends Error {
  constructor(public message: string = '用户未登录') {
    super(message);
  }
}

@Catch(UnLoginException)
export class UnloginFilter implements ExceptionFilter {
  catch(exception: UnLoginException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response
      .status(HttpStatus.UNAUTHORIZED)
      .json({
        code: HttpStatus.UNAUTHORIZED,
        message: 'fail',
        data: exception.message,
      })
      .end();
  }
}
