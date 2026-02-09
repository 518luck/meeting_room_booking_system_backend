import { UserModule } from '@/user/user.module';
import { Module } from '@nestjs/common';
import { LocalStrategy } from '@/auth/local.strategy';
import { GoogleStrategy } from '@/auth/google.strategy';

@Module({
  imports: [UserModule],
  providers: [LocalStrategy, GoogleStrategy],
})
export class AuthModule {}
