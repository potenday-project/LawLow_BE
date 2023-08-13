import { Controller, Param, ParseEnumPipe, Body, Res, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Provider } from '@prisma/client';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {}

  @Post('/login/:login_type')
  @ApiOperation({
    summary: '소셜 로그인 API',
  })
  @ApiParam({
    name: 'login_type',
    enum: Provider,
    enumName: 'Provider',
  })
  @ApiResponse({
    status: 201,
    description: '로그인 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  async oAuthLogin(
    @Res() res: Response,
    @Param('login_type', new ParseEnumPipe(Provider))
    login_type: Provider,
    @Body() loginDto: LoginDto,
  ) {
    const { accessToken, refreshToken } = await this.authService.oAuthLogin(login_type, loginDto.token);

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

    return { accessToken };
  }
}
