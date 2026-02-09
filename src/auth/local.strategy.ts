import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
// import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { UserService } from '@/user/user.service';
import { LoginUserDto } from '@/user/dto/login-user.dto';
import { Request } from 'express';

@Injectable() //我是可被利用的
//这个装饰器放在类定义的上方。它的意思是：“NestJS，请把这个类收编进你的容器里，我是一个可以被别人使用的提供者 (Provider)。”
export class LocalStrategy extends PassportStrategy(Strategy) {
  //   @Inject(UserService) //我要指定那个东西
  //这个装饰器通常放在构造函数 (Constructor) 的参数前或属性前。它的意思是：“NestJS，我知道你要给我注入东西，但我得明确指定要哪一个。”
  //   private userService: UserService;

  constructor(private userService: UserService) {
    super({
      // 💡 开启这个开关，validate 的第一个参数就会变成 request
      passReqToCallback: true,
    });
  }

  async validate(req: Request, username: string, password: string) {
    const isAdmin = req.url.includes('admin');

    const dto = new LoginUserDto();
    dto.username = username;
    dto.password = password;

    const user = await this.userService.login(dto, isAdmin);
    return user;
  }
}
