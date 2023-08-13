import { Request } from 'express';

export interface JwtPayloadInfo {
  userId: number;
}

export interface CreateUserInfo {
  social_id: string;
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
