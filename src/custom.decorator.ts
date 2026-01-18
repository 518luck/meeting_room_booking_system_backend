import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtUserData } from '@/types/global';

// 登录校验装饰器
export const RequireLogin = () => SetMetadata('require-login', true);

// 权限校验装饰器
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('require-permission', permissions);

// 参数装饰器
export const UserInfo = createParamDecorator(
  (data: keyof JwtUserData, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (!request.user) {
      return null;
    }

    return data ? request.user[data] : request.user;
  },
);
