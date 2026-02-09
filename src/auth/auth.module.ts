import { UserModule } from '@/user/user.module';
import { Module } from '@nestjs/common';
import { LocalStrategy } from '@/auth/local.strategy';

@Module({
  imports: [UserModule],
  providers: [LocalStrategy],
})
export class AuthModule {}
