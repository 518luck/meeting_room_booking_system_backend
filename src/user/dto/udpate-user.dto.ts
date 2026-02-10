import { ApiProperty, PickType } from '@nestjs/swagger';
import { RegisterUserDto } from '@/user/dto/register-user.dto';

export class UpdateUserDto extends PickType(RegisterUserDto, [
  'email',
  'captcha',
]) {
  @ApiProperty()
  headPic: string;

  @ApiProperty()
  nickName: string;
}
