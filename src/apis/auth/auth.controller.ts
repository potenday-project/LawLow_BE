import { Controller, Param, ParseEnumPipe, Body, Res, Req, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Provider } from '@prisma/client';
import { Request, Response } from 'express';
import { LoginDto } from './dtos/login.dto';
import { AuthGuard } from './security/guards/access-token.guard';
import { SetAuthGuardType } from 'src/common/decorators/auth-guard-type.decorator';
import { AuthGuardType } from 'src/common/types';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login/:login_type')
  @ApiOperation({
    summary: '소셜 로그인 API',
    description: `
    로그인 완료 시 AT(accessToken), RT(refreshToken)를 발급합니다.
    AT는 응답 body에 담겨서 전달되며, RT는 httpOnly secure 쿠키에 담겨서 전달됩니다.
    AT 만료 시 RT를 통해 AT를 refresh 하여 로그인 상태를 유지합니다.`,
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
  @SetAuthGuardType(AuthGuardType.REFRESH)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '토큰 리프레시 API',
    description: `
    AT 만료 시 쿠키에 담겨오는 RT를 활용하여 AT를 refresh합니다.(보안을 위해 RT도 함께 refresh 됩니다.)`,
  })
  async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userRefreshToken = req.cookies['refreshToken'];
    const { accessToken, refreshToken } = await this.authService.refreshToken(res, userRefreshToken);
    this.authService.setRefreshToken(res, refreshToken);

    return { accessToken };
  }
}
