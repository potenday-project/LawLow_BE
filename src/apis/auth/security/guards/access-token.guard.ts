import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuardType, UserPayloadInfo, RefreshToktenPayloadInfo } from '../../../../common/types';
import { AUTH_GUARD_TYPE_KEY } from '../../../../common/decorators/auth-guard-type.decorator';
import { AuthService } from '../../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authGuardType: AuthGuardType = this.reflector.getAllAndOverride<AuthGuardType>(AUTH_GUARD_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('🚀 ~ file: access-token.guard.ts:31 ~ AuthGuard ~ canActivate ~ authGuardType:', authGuardType);

    switch (authGuardType) {
      case AuthGuardType.ACCESS:
        return await this.validateAccessToken(context);

      case AuthGuardType.REFRESH:
        return await this.validateRefreshToken(context);

      default:
        throw new InternalServerErrorException('존재하지 않는 AuthGuardType 입니다.');
    }
  }

  private async validateAccessToken(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('토큰이 없습니다.');
    }

    try {
      const payload: UserPayloadInfo = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('ACCESS_SECRET_KEY'),
      });

      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
    return true;
  }

  private async validateRefreshToken(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies['refreshToken'];

    if (!token) {
      throw new UnauthorizedException('토큰이 없습니다.');
    }

    try {
      const payload: RefreshToktenPayloadInfo = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('REFRESH_SECRET_KEY'),
      });
      const { userId } = payload;
      const user = await this.usersService.findOneById(userId);
      if (!user) {
        throw new NotFoundException('토큰값에 해당하는 유저가 존재하지 않습니다.');
      }
      const userPayloadInfo = this.authService.getUserPayloadInfo(user);

      request['user'] = userPayloadInfo;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
