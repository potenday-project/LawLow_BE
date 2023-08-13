import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';

export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  //UseGuards의 이름과 동일하게 설정
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: Profile, cb: VerifyCallback) {
    try {
      const { id, displayName, emails, photos } = profile;
      const user = {
        id: id,
        name: displayName,
        email: emails[0].value,
        photo: photos[0].value,
      };
      cb(null, user);
    } catch (error) {
      cb(error);
    }
  }
}
