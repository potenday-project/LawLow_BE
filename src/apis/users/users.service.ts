import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Provider, User } from '@prisma/client';
import { CreateUserInfo } from '../../common/types';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findOne(email: string): Promise<User> {
    return await this.prismaService.user.findUnique({ where: { email } });
  }

  async create(user: CreateUserInfo, provider: Provider): Promise<User> {
    const isExist = await this.findOne(user.email);
    console.log('isExist: ', isExist, typeof isExist);
    if (isExist) {
      throw new BadRequestException('이미 존재하는 이메일의 유저입니다.');
    }
    const isExistOAuthId = await this.prismaService.oauthid.findUnique({
      where: { id: user.id },
    });
    if (isExistOAuthId) {
      throw new BadRequestException('이미 존재하는 소설 계정입니다.');
    }

    const newUserResult = await this.prismaService.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: user.email,
          name: user.name,
          profileImage: user.photo,
        },
      });

      await tx.oauthid.create({
        data: {
          id: user.id,
          provider,
          userId: newUser.id,
        },
      });

      return newUser;
    });

    return newUserResult;
  }
}
