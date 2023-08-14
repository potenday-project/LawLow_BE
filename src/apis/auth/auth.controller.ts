import { Controller, Param, ParseEnumPipe, Body, Res, Post, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Provider } from '@prisma/client';
import { Response } from 'express';
import { LoginDto } from './dtos/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtUserPayload } from 'src/common/decorators/jwt-user.decorator';
import { JwtPayloadInfo, GetUserInfo } from 'src/common/types';
import { UsersService } from '../users/users.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly usersService: UsersService) {}

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

  @Get('/me')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '내 정보 조회 API',
    description: `
    로그인 상태인 경우 내 정보를 조회합니다.
    로그인 상태가 아닌 경우 401 에러가 발생합니다.`,
  })
  @ApiResponse({
    status: 200,
    description: '내 정보 조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            userId: {
              type: 'number',
            },
            email: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            profileImageUrl: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  async getMyInfo(@JwtUserPayload() jwtUser: JwtPayloadInfo): Promise<GetUserInfo> {
    const user = await this.usersService.findOneById(jwtUser.userId);
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      profileImageUrl: user.profileImage,
    };
  }

  @Post('/silent-refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({
    summary: '토큰 리프레시 API',
    description: `
    AT 만료 시 쿠키에 담겨오는 RT를 활용하여 AT를 refresh합니다.(추가 보안 작업 하면서 RT refresh도 함께 진행될 예정)`,
  })
  async refreshToken(@JwtUserPayload() jwtUser: JwtPayloadInfo) {
    const { accessToken } = await this.authService.generateTokens(jwtUser);
    // this.authService.setRefreshToken(res, refreshToken); // TODO: 추가 보안 작업 및 RT refresh도 함께 진행할 것.

    return { accessToken };
  }
}
