import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayloadInfo } from '../../../../common/types';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../users/users.service';
import { AuthService } from '../../auth.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {
    // token 유효 확인
    super({
      secretOrKey: configService.get<string>('REFRESH_SECRET_KEY'),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const cookieToken = request.cookies['refreshToken'];
          return cookieToken;
        },
      ]),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayloadInfo): Promise<JwtPayloadInfo> {
    const { userId } = payload;
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('토큰값에 해당하는 유저가 존재하지 않습니다.');
    }

    // TODO: 1. RT의 jti 검증
    // -> RT 토큰의 jti를 Cache에 저장해두고 검증
    // -> RT 토큰의 jti가 Cache에 존재하는 jti와 일치하지 않으면 검증 실패

    // TODO: 2. AT 리프래시 할 때 RT도 함께 리프래시하고, 새로운 RT의 jti를 Cache에 저장
    // -> 최초 로그인 시에도 RT의 jti를 Cache에 저장해야 함.
    // -> (TODO2 로직은 AuthController의 silentRefresh API에서 구현)

    return payload; // req.user에 저장됨.
  }
}
