import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserPayloadInfo, CreateUserInfo } from 'src/common/types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Provider, User } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { LoginTicket, OAuth2Client, TokenPayload } from 'google-auth-library';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async oAuthLogin(login_type: Provider, token: string): Promise<{ accessToken: string; refreshToken: string }> {
    let oAuthUser: CreateUserInfo;
    switch (login_type) {
      case Provider.google:
        oAuthUser = await this.loginWithGoogle(token);
        break;

      default:
        throw new BadRequestException('잘못된 로그인 타입입니다.');
    }

    let user: User = await this.usersService.findOne(oAuthUser.email);

    // 자동 회원가입
    if (!user) {
      user = await this.usersService.create(oAuthUser, login_type);
    }

    // 토큰 발급
    const userPayloadInfo = this.getUserPayloadInfo(user);
    const { accessToken, refreshToken } = await this.getTokens(userPayloadInfo);

    return { accessToken, refreshToken };
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
