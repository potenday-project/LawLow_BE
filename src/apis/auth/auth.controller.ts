import { Controller, Req, UseGuards, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { PassportGoogleUser } from 'src/common/types';
import { Provider } from '@prisma/client';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/login/google')
  @UseGuards(AuthGuard('google')) // google strategy
  async loginGoogle(@Req() req: Request & PassportGoogleUser, @Res() res: Response) {
    await this.authService.OAuthLogin(req, res, Provider.google);
  }
}
