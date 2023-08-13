import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Provider, User } from '@prisma/client';
import { CreateUserInfo } from '../../common/types';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findOneByOAuthId(oauthId: string, loginType: Provider): Promise<User> {
    return await this.prismaService.user.findFirst({
      where: { oauthIds: { some: { provider: loginType, id: oauthId } } },
    });
  }

  async findOneById(id: number): Promise<User> {
    return await this.prismaService.user.findUnique({ where: { id } });
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.prismaService.user.findUnique({ where: { email } });
  }

  async create(user: CreateUserInfo, provider: Provider): Promise<User> {
    // validation
    const isExistEmail = await this.findOneByEmail(user.email);
    if (isExistEmail) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }
    const isExistOAuthId = await this.findOneByOAuthId(user.social_id, provider);
    if (isExistOAuthId) {
      throw new BadRequestException('이미 존재하는 소설 계정입니다.');
    }

    // create user
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
          id: user.social_id,
          provider,
          userId: newUser.id,
        },
      });

      return newUser;
    });

    return newUserResult;
  }
}
