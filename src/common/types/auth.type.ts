import { Request } from 'express';

export interface JwtPayloadInfo {
  userId: number;
  iat?: number;
  exp?: number;
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

export interface GetUserInfo {
  userId: number;
  email: string;
  name: string;
  profileImageUrl: string;
}
