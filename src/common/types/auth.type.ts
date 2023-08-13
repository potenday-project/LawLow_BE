import { Request } from 'express';

export interface UserPayloadInfo {
  userId: number;
  name: string;
  email: string;
  profileImage: string;
}

export interface CreateUserInfo {
  social_id: string;
  email: string;
  name: string;
  photo: string;
}

export interface RequestWithUser extends Request {
  user: UserPayloadInfo;
}
