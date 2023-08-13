import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserPayloadInfo, CreateUserInfo } from 'src/common/types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Provider, User } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { LoginTicket, OAuth2Client, TokenPayload } from 'google-auth-library';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async oAuthLogin(loginType: Provider, token: string): Promise<{ accessToken: string; refreshToken: string }> {
    // OAuth 토큰 검증
    let oAuthUser: CreateUserInfo;
    switch (loginType) {
      case Provider.google:
        oAuthUser = await this.loginWithGoogle(token);
        break;

      default:
        throw new BadRequestException('잘못된 로그인 타입입니다.');
    }

    let user: User = await this.usersService.findOneByOAuthId(oAuthUser.social_id, loginType);

    // 자동 회원가입
    if (!user) {
      user = await this.usersService.create(oAuthUser, loginType);
    }

    // 토큰 발급
    const userPayloadInfo = this.getUserPayloadInfo(user);
    const { accessToken, refreshToken } = await this.getTokens(userPayloadInfo);

    return { accessToken, refreshToken };
  }

  async refreshToken(res: Response, userRefreshToken: string) {
    let userId: number;

    if (!userRefreshToken) {
      throw new UnauthorizedException('Refresh Token이 없습니다.');
    }

    try {
      const payload = await this.verifyToken(userRefreshToken, {
        isRefreshToken: true,
      });
      userId = payload.userId;
    } catch (err) {
      res.cookie('refreshToken', '', {
        maxAge: 0,
      });
      throw new UnauthorizedException(err.message);
    }

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 유저입니다.');
    }

    const { accessToken, refreshToken } = await this.getTokens(this.getUserPayloadInfo(user));

    return {
      accessToken,
      refreshToken,
    };
  }

  verifyToken(token: string, { isRefreshToken }: { isRefreshToken: boolean } = { isRefreshToken: false }) {
    const payload: UserPayloadInfo | { userId: number } = this.jwtService.verify(token, {
      secret: this.configService.get(`${isRefreshToken ? 'REFRESH' : 'ACCESS'}_SECRET_KEY`),
    });

    return payload;
  }

  private async loginWithGoogle(token: string): Promise<CreateUserInfo> {
    let account: CreateUserInfo;
    const clientId: string = this.configService.get('GOOGLE_CLIENT_ID_PROD');
    const client: OAuth2Client = new OAuth2Client(clientId);

    try {
      const ticket: LoginTicket = await client.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      const payload: TokenPayload = ticket.getPayload();

      account = {
        social_id: payload.sub,
        email: payload.email,
        name: payload.name,
        photo: payload.picture,
      };
    } catch (err) {
      this.logger.warn(err);
      throw new BadRequestException('잘못된 토큰입니다.');
    }

    return account;
  }

  getUserPayloadInfo(user: User): UserPayloadInfo {
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
    };
  }

  private async getTokens(user: UserPayloadInfo): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(user, {
        secret: this.configService.get('ACCESS_SECRET_KEY'),
        expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(
        { userId: user.userId },
        {
          secret: this.configService.get('REFRESH_SECRET_KEY'),
          expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  setRefreshToken(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      domain:
        this.configService.get('NODE_ENV') === 'development'
          ? 'localhost'
          : this.configService.get('COMMON_COOKIE_DOMAIN'),
      httpOnly: true,
      path: '/',
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: 24 * 60 * 60 * 1000 * 14, // 14일
    });
  }
}
