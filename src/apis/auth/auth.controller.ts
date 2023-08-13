import { Controller, Param, ParseEnumPipe, Body, Res, Req, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {}

  @Post('/login/:login_type')
  @ApiOperation({
    summary: '소셜 로그인 API',
    description: `로그인 완료 시 AT(accessToken), RT(refreshToken)를 발급합니다. AT는 30분, RT는 7일간 유효합니다. 
    AT는 응답 body에 담겨서 전달되며, RT는 httpOnly secure 쿠키에 담겨서 전달됩니다.
    AT 만료 시 RT를 활용하여 AT를 refresh할 수 있습니다.`,
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
    description: 'AT 만료 시 RT 활용하여 AT과 RT을 refresh합니다.',
  })
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userRefreshToken = req.cookies['refreshToken'];
    const { accessToken, refreshToken } = await this.authService.refreshToken(res, userRefreshToken);
    this.authService.setRefreshToken(res, refreshToken);

    return { accessToken };
  }
}
