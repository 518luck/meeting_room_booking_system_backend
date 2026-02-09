import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    // 变量名建议：以 google 开头，清晰明了
    const googleClientId = configService.get<string>('google_client_id') || '';
    const googleClientSecret =
      configService.get<string>('google_client_secret') || '';
    const googleCallbackUrl =
      configService.get<string>('google_callback_url') || '';

    super({
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackUrl,
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0].value || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0].value || '',
      accessToken,
    };
    return user;
  }
}
