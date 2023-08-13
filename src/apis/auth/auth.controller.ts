import { Controller, Param, ParseEnumPipe, Body, Res, Req, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login.dto';
import { RequestWithUser } from 'src/common/types';

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
    @Res({ passthrough: true }) res: Response,
    @Param('login_type', new ParseEnumPipe(Provider))
    login_type: Provider,
    @Body() loginDto: LoginDto,
  ) {
    const { accessToken, refreshToken } = await this.authService.oAuthLogin(login_type, loginDto.token);
    this.authService.setRefreshToken(res, refreshToken);

    return { accessToken };
  }

  @Post('/silent-refresh')
  @ApiOperation({
    summary: '토큰 리프레시 API',
    description: 'refreshToken을 활용하여 accessToken과 refreshToken을 refresh합니다.',
  })
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userRefreshToken = req.cookies['refreshToken'];
    const { accessToken, refreshToken } = await this.authService.refreshToken(res, userRefreshToken);
    this.authService.setRefreshToken(res, refreshToken);

    return { accessToken };
  }
}
