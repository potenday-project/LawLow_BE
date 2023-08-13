import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Request, Response } from 'express';
import { PassportGoogleUser, UserPayloadInfo } from 'src/common/types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Provider, User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async OAuthLogin(req: Request & PassportGoogleUser, res: Response, provider: Provider) {
    let user = await this.usersService.findOne(req.user.email);

    // 자동 회원가입
    if (!user) {
      user = await this.usersService.create(req.user, provider);
    }

    // 토큰 발급
    const userPayloadInfo = this.getUserPayloadInfo(user);
    const { refreshToken } = await this.getTokens(userPayloadInfo);

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
    res.redirect(`https://${this.configService.get('CLIENT_BASE_URL')}/login/success`);

    return;
  }

  private getUserPayloadInfo(user: User): UserPayloadInfo {
    return {
      id: user.id,
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
        { id: user.id },
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
}
