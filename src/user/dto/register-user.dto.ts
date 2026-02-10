import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { LoginUserDto } from '@/user/dto/login-user.dto';

export class RegisterUserDto extends PickType(LoginUserDto, [
  'username',
  'password',
]) {
  @IsNotEmpty({
    message: '昵称不能为空',
  })
  @ApiProperty({
    description: '昵称',
    example: '一灯',
  })
  nickName: string;

  @IsNotEmpty({
    message: '邮箱不能为空',
  })
  @IsEmail(
    {},
    {
      message: '不是合法的邮箱格式',
    },
  )
  @ApiProperty({
    description: '邮箱',
    example: 'xxx@xx.com',
  })
  email: string;

  @IsNotEmpty({
    message: '验证码不能为空',
  })
  @ApiProperty({
    description: '验证码',
    example: '123456',
  })
  captcha: string;
}
