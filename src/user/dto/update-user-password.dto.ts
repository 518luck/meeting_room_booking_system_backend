import { PickType } from '@nestjs/swagger';
import { RegisterUserDto } from '@/user/dto/register-user.dto';

export class UpdateUserPasswordDto extends PickType(RegisterUserDto, [
  'email',
  'captcha',
  'username',
  'password',
]) {}
