export interface UserPayloadInfo {
  id: number;
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
