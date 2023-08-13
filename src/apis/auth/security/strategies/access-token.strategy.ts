import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayloadInfo } from '../../../../common/types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(private readonly configService: ConfigService) {
    // token 유효 확인
    super({
      secretOrKey: configService.get<string>('ACCESS_SECRET_KEY'),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const headerToken = this.extractTokenFromHeader(request);
          return headerToken;
        },
      ]),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayloadInfo): JwtPayloadInfo {
    return payload; // req.user에 저장됨.
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
