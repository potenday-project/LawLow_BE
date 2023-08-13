import { Request } from 'express';

export interface UserPayloadInfo {
  userId: number;
  name: string;
  email: string;
  profileImage: string;
}

export type RefreshToktenPayloadInfo = Pick<UserPayloadInfo, 'userId'>;

export interface CreateUserInfo {
  social_id: string;
  email: string;
  name: string;
  photo: string;
}

export interface RequestWithUser extends Request {
  user: UserPayloadInfo;
}

export enum AuthGuardType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}
