import { Request } from 'express';

export interface JwtPayloadInfo {
  userId: number;
}

export interface CreateUserInfo {
  oauthId: string;
  email: string;
  name: string;
  photo: string;
}

export interface RequestWithUser extends Request {
  user: JwtPayloadInfo;
}

export enum AuthGuardType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}
